import _ from 'lodash';
import config from 'config';
import express from 'express';
import httpErrors from 'http-errors';
import moment from 'moment';

import uuid from '../../util/uuid';
import { Create as CreateSession } from '../../sessions';

import { AssociationSessionTC } from '../../../schema/models/association-sessions';
import { ConnectionTC } from '../../../schema/models/connections';
import { ProviderTC } from '../../../schema/models/providers';
import { UserTC } from '../../../schema/models/users';


let router = express.Router();

let complete = router.route('/');


async function completeHandler(req, res, next) {
	await env.validate('#/types/uuid4', req.query.connection_id)
		.catch(function(err) {
			throw new Error('Connection ID must be a 32-character UUID with no dashes.')
		});

	await env.validate('#/types/uuid4', req.query.map_id)
		.catch(function() {
			throw new Error('Map ID must be a 32-character UUID with no dashes.')
		});

	if (req.query.existing_connection_id) {
		await env.validate('#/types/uuid4', req.query.existing_connection_id)
			.catch(function() {
				throw new Error('Existing Connection ID must be a 32-character UUID with no dashes.')
			});
	}

	let user = await completeLogin(req, res, next);

	await completeConnection(req, res, next, user);

	if (req.user == null) {
		res.redirect('/');
	}
	else {
		res.redirect('/providers');
	}
}


async function completeLogin(req, res, next) {
	let bitscoop = env.bitscoop;

	if (req.user == null) {
		try {
			let $filter = {
				token_string: req.cookies['login_assoc'],
				connection_id_string: req.query.connection_id
			};

			let assoc_count = AssociationSessionTC.getResolver('count').resolve({
				args: {
					filter: $filter
				}
			});

			if (assoc_count === 0) {
				throw new Error('Invalid association session or association session timeout');
			}

			await AssociationSessionTC.getResolver('removeOne').resolve({
				args: {
					filter: $filter
				}
			});

			let bitscoopConnection = await bitscoop.getConnection(req.query.existing_connection_id || req.query.connection_id);

			if (bitscoopConnection == null) {
				throw new Error('Invalid BitScoop Connection');
			}

			if (!_.get(bitscoopConnection, 'auth.status.authorized', false)) {
				throw new Error('Connection is not authorized. In order to use this account you must grant the requested permissions.');
			}

			let connection = await ConnectionTC.getResolver('findOne').resolve({
				args: {
					filter: {
						remote_connection_id_string: bitscoopConnection.id
					}
				}
			});

			let user;

			if (connection && connection.user_id) {
				user = await UserTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: connection.user_id.toString('hex')
						}
					}
				});
			}

			if (!user) {
				user = await UserTC.getResolver('createOne').resolve({
					args: {
						record: {
							id: uuid(),
							api_key_string: uuid(),
							joined: moment().utc().toDate(),
							last_location_estimation: moment().utc().subtract(1410, 'minutes').toDate()
						}
					}
				});

				user = user.record;
			}

			if (!user) {
				throw new Error('User did not exist and could not be created');
			}

			let session = await CreateSession(req, user, {
				persist: true
			});

			await UserTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: user._id.toString('hex')
					},
					record: {
						is_active: true,
						last_login: moment().utc().toDate()
					}
				}
			});

			res.cookie(config.sessions.cookieName, session.token, {
				domain: config.domain,
				secure: true,
				httpOnly: true,
				expires: session.expires
			});

			return user;
		} catch(err) {
			console.log(err);

			res.redirect('/')
		}
	}
	else {
		return req.user;
	}
}

async function completeConnection(req, res, next, user) {
	let provider = await ProviderTC.getResolver('findOne').resolve({
		args: {
			filter: {
				remote_map_id_string: req.query.map_id
			}
		}
	});

	if (req.query.existing_connection_id) {
		await ConnectionTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					user_id_string: user._id.toString('hex'),
					remote_connection_id_string: req.query.connection_id
				}
			}
		});

		let existingConnection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					remote_connection_id_string: req.query.existing_connection_id
				}
			}
		});

		if (!existingConnection || !provider) {
			throw new httpErrors(404);
		}

		if (existingConnection.user_id == null || (existingConnection.user_id.toString('hex') === user._id.toString('hex'))) {
			return await ConnectionTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: existingConnection._id.toString('hex')
					},
					record: {
						'auth.status.authorized': true,
						'auth.status.complete': true,
						status: 'ready',
						user_id_string: user._id.toString('hex')
					}
				}
			});
		}
		else {
			return Promise.resolve();
		}
	}
	else {
		let connection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					remote_connection_id_string: req.query.connection_id
				}
			}
		});

		if (!connection || !provider) {
			throw new httpErrors(404);
		}

		return await ConnectionTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: connection._id.toString('hex')
				},
				record: {
					'auth.status.authorized': true,
					'auth.status.complete': true,
					status: 'ready',
					user_id_string: user.id
				}
			}
		});
	}
}

complete.get(completeHandler);


export default router;