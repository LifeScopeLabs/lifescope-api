'use strict';

import config from 'config';
import express from 'express';
import moment from 'moment';

import EmailClient from '../../extensions/mandrill/email-client.js';
import uuid from '../../../lib/util/uuid.js';
import { LoginSessionTC } from '../../../schema/models/login-sessions.js';
import { UserTC } from '../../../schema/models/users.js';

let router = express.Router();
let signup = router.route('/');

let emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;


signup.post(async function(req, res) {
	let existingUser;
	let errors = [];
	let body = req.body;
	let emailTest = emailRegex.test(body.email);
	
	if (emailTest !== true) {
		errors.push('invalid_email');
	}

	if (body.terms_accepted !== true) {
		errors.push('terms_not_accepted');
	}

	if (emailTest === true && body.terms_accepted === true) {
		existingUser = await UserTC.getResolver('findOne').resolve({
			args: {
				filter: {
					email: body.email
				}
			}
		});

		if (existingUser != null) {
			errors.push('email_in_use');
		}
	}

	if (errors.length === 0) {
		let id = uuid();
		let token = uuid();
		let expiration = moment.utc().add(600, 'seconds').toDate();

		let record = {
			id: id,
			token_string: token,
			ttl: expiration,
			type: 'signup',
			email: body.email,
			newsletter: body.newsletter === true
		};

		try {
			await LoginSessionTC.getResolver('createOne').resolve({
				args: {
					record: record
				}
			});

			let emailClient = new EmailClient();

			await emailClient.send(body.email, {
				template: 'lifescope-signup',
				context: {
					token: token
				}
			});

			res.cookie(config.login.cookieName, token.toString('hex'), {
				domain: config.domain,
				secure: true,
				httpOnly: true,
				expires: expiration
			});

			res.sendStatus(200);
		}
		catch(err) {
			console.log(err); //eslint-disable-line no-console

			return res.status(400);
		}
	}
	else {
		return res.status(400).send({
			message: errors.join(',')
		})
	}
});

export default router;
