'use strict';

import Tokens from 'csrf';
import _ from 'lodash';
import config from 'config';
import httpErrors from 'http-errors';


let options = _.pick(config.sessions.csrf, ['saltLength', 'secretLength']);
let tokens = new Tokens(options);


function create(req, res, next) {
	if (req.session && req.session.csrf_secret) {
		if (res.context == null) {
			res.context = {};
		}

		res.context.csrf_token = tokens.create(req.session.csrf_secret);
	}

	next();
}

async function validate(req, res, next) {
	if (req.session) {
		try {
			if (!req.session) {
				throw httpErrors(403, 'Missing session for CSRF validation.');
			}

			if (!req.session.csrf_secret) {
				throw httpErrors(403, 'Missing CSRF secret for CSRF validation.');
			}

			let csrftoken = (req.body && req.body.csrftoken) ||
				(req.query && req.query.csrftoken) ||
				(req.headers['x-csrftoken']) ||
				(req.headers['csrf-token']) ||
				(req.headers['xsrf-token']) ||
				(req.headers['x-csrf-token']) ||
				(req.headers['x-xsrf-token']);

			if (!tokens.verify(req.session.csrf_secret, csrftoken)) {
				console.log(req.session);
				console.log(req.body);
				throw httpErrors(403, 'Invalid CSRF token.');
			}

			next();
		}
		catch (err) {
			console.log(err); //eslint-disable-line no-console

			res.setHeader('Content-Type', 'application/json');
			res.status(err.status);
			res.send(JSON.stringify(err));
		}
	}
	else {
		next();
	}
}


export default {
	create: create,
	tokens: tokens,
	validate: validate
};
