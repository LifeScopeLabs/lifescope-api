'use strict';

import config from 'config';
import express from 'express';
import moment from 'moment';

import { Create as CreateSession } from '../../sessions.js';
import { LoginSessionTC } from '../../../schema/models/login-sessions.js';
import { UserTC } from '../../../schema/models/users.js';

let router = express.Router();
let login = router.route('/');


login.get(async function(req, res) {
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
						type: 'login'
					}
				}
			});

			if (loginSession == null) {
				return res.redirect('/');
			}
			else {
				user = await UserTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: loginSession.user_id.toString('hex')
						}
					}
				});

				if (user == null) {
					throw new Error('User does not exist');
				}

				await UserTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							id: loginSession.user_id.toString('hex')
						},
						record: {
							last_login: moment().utc().toDate()
						}
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

				return res.redirect('/');
			}
		}
		catch(err) {
			console.log(err); //eslint-disable-line no-console

			throw new Error(err);
		}
	}
	else {
		return res.redirect('/');
	}
});

export default router;
