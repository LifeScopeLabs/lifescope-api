'use strict';

import express from 'express';
import moment from 'moment';

import uuid from '../../../lib/util/uuid';
import { Create as CreateSession } from '../../sessions';
import { LoginSessionTC } from '../../../schema/models/login-sessions.js';
import { UserTC } from '../../../schema/models/users.js';
import config from 'config';
import { PeopleTC } from '../../../schema/models/people';

let router = express.Router();
let signup = router.route('/');


signup.get(async function(req, res) {
	let user;
	let errors = [];
	let query = req.query;
	let login_cookie = req.cookies[config.login.cookieName];

	if (query.token !== login_cookie) {
		errors.push('login_token_cookie_mismatch');
	}

	if (errors.length === 0) {
		try {
			let loginSession = await LoginSessionTC.getResolver('findOne').resolve({
				args: {
					filter: {
						token_string: query.token,
						type: 'signup'
					}
				}
			});

			if (loginSession == null) {
				res.redirect('/');
			}
			else {
				user = await UserTC.getResolver('createOne').resolve({
					args: {
						record: {
							id: uuid(),
							email: loginSession.email,
							api_key_string: uuid(),
							joined: moment().utc().toDate(),
							last_location_estimation: moment().utc().subtract(1410, 'minutes').toDate(),
							newsletter: loginSession.newsletter === true,
							is_active: true,
							last_login: moment().utc().toDate()
						}
					}
				});

				user = user.record;

				let record = {
					_id: uuid(uuid()),
					contact_ids: [],
					created: moment().utc().toDate(),
					self: true,
					updated: moment().utc().toDate(),
					user_id: user._id
				};

				await PeopleTC.getResolver('createOne').resolve({
					args: {
						record: record
					}
				});

				await LoginSessionTC.getResolver('removeOne').resolve({
					args: {
						filter: {
							id: loginSession._id.toString('hex')
						}
					}
				});

				let session = await CreateSession(req, user, {
					persist: true
				});

				res.cookie(config.sessions.cookieName, session.token, {
					domain: config.domain,
					secure: true,
					httpOnly: true,
					expires: session.expires
				});

				res.redirect('/providers');
			}
		}
		catch(err) {
			console.log(err);

			throw new Error(err);
		}
	}
	else {
		console.log(errors);

		res.redirect('/');
	}
});

export default router;
