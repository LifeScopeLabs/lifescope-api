/* global env */

import _ from 'lodash';
import config from 'config';
import express from 'express';
import httpErrors from 'http-errors';
import moment from 'moment';

import uuid from '../../util/uuid.js';
import { Create as CreateSession } from '../../sessions.js';
import createSelfContact from '../../util/create-self-contact.js'

import { AssociationSessionTC } from '../../../schema/models/association-sessions.js';
import { ConnectionTC } from '../../../schema/models/connections.js';
import { ProviderTC } from '../../../schema/models/providers.js';
import { SessionTC } from '../../../schema/models/sessions.js';
import { UserTC } from '../../../schema/models/users.js';


let router = express.Router();

let complete = router.route('/');


async function completeHandler(req, res, next) {
	await env.validate('#/types/uuid4', req.query.connection_id)
		.catch(function() {
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

	let authParams = req.cookies[config.oauth.tempCookieName];

	if (authParams != null) {
		res.clearCookie(config.oauth.tempCookieName, {
			domain: config.domain,
			httpOnly: true
		});

		return res.redirect('https://' + config.appDomain + '/auth?' + authParams);
	}
	else if (req.user == null) {
		return res.redirect('/');
	}
	else {
		return res.redirect('/providers');
	}
}


async function completeLogin(req, res) {
	let bitscoop = env.bitscoop;

	if (req.user == null) {
		try {
			let $filter = {
				token_string: req.cookies[config.login.cookieName],
				connection_id_string: req.query.connection_id
			};

			let assocSession = await AssociationSessionTC.getResolver('findOne').resolve({
				args: {
					filter: $filter
				}
			});

			if (assocSession == null) {
				throw new Error('Invalid association session or association session timeout');
			}

			let bitscoopConnection = await bitscoop.getConnection(req.query.existing_connection_id || req.query.connection_id);

			if (bitscoopConnection == null) {
				throw new Error('Invalid BitScoop Connection');
			}

			if (req.query.existing_connection_id == false && !_.get(bitscoopConnection, 'auth.status.authorized', false)) {
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

			if (assocSession && assocSession.app_session_token) {
				await SessionTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							token: assocSession.app_session_token
						},
						record: {
							pending: false,
							expires: moment().utc().add(14, 'days').toDate(),
							ttl: moment().utc().add(14, 'days').toDate(),
							user_id_string: user._id.toString('hex')
						}
					}
				});
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

			await AssociationSessionTC.getResolver('removeOne').resolve({
				args: {
					filter: $filter
				}
			});

			return user;
		}
		catch (err) {
			console.log(err); //eslint-disable-line no-console

			return res.redirect('/')
		}
	}
	else {
		try {
			let $filter = {
				token_string: req.cookies[config.login.cookieName],
				connection_id_string: req.query.connection_id
			};

			let assocSession = await AssociationSessionTC.getResolver('findOne').resolve({
				args: {
					filter: $filter
				}
			});

			await AssociationSessionTC.getResolver('removeOne').resolve({
				args: {
					filter: $filter
				}
			});

			if (assocSession && assocSession.app_session_token) {
				await SessionTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							token: assocSession.app_session_token
						},
						record: {
							pending: false,
							expires: moment().utc().add(14, 'days').toDate(),
							ttl: moment().utc().add(14, 'days').toDate(),
							user_id_string: req.user._id.toString('hex')
						}
					}
				});
			}

			return req.user;
		}
		catch (err) {
			console.log(err); //eslint-disable-line no-console

			return res.redirect('/providers');
		}
	}
}

async function completeConnection(req, res, next, user) {
	try {
		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					remote_map_id_string: req.query.map_id
				}
			}
		});

		let connection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					remote_connection_id_string: req.query.connection_id
				}
			}
		});

		if (req.query.existing_connection_id) {
			if (connection.auth.status.complete !== true) {
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
					existingConnection.user_id = user._id;

					let bitscoopConnection = await env.bitscoop.getConnection(existingConnection.remote_connection_id.toString('hex'));

					await createSelfContact(existingConnection);

					return await ConnectionTC.getResolver('updateOne').resolve({
						args: {
							filter: {
								id: existingConnection._id.toString('hex')
							},
							record: {
								'auth.status.authorized': true,
								'auth.status.complete': true,
								metadata: bitscoopConnection.metadata,
								status: 'ready',
								user_id_string: user._id.toString('hex')
							}
						}
					});

				}
				else {
					res.cookie(config.errors.accountAlreadyConnected.cookieName, connection.provider_name, {
						domain: config.domain,
						secure: true
					});

					return Promise.resolve();
				}
			}
			else {
				res.cookie(config.errors.accountAlreadyConnected.cookieName, connection.provider_name, {
					domain: config.domain,
					secure: true
				});

				return Promise.resolve();
			}
		}
		else {
			if (req.query.auth_error && req.query.auth_error === 'non_matching_accounts') {
				res.cookie(config.errors.nonMatchingAccounts.cookieName, connection.provider_name, {
					domain: config.domain,
					secure: true
				});

				return Promise.resolve();
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

				connection.user_id = user._id;

				let bitscoopConnection = await env.bitscoop.getConnection(connection.remote_connection_id.toString('hex'));

				await createSelfContact(connection);

				return await ConnectionTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							id: connection._id.toString('hex')
						},
						record: {
							'auth.status.authorized': true,
							'auth.status.complete': true,
							metadata: bitscoopConnection.metadata,
							status: 'ready',
							user_id_string: user.id
						}
					}
				});
			}
		}
	}
	catch (err) {
		throw err;
	}
}

complete.get(completeHandler);


export default router;