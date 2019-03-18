'use strict';

import config from 'config';
import express from 'express';
import httpErrors from 'http-errors';

import { OAuthTokenTC } from '../../../schema/models/oauth-tokens';

let router = express.Router();
let accessToken = router.route('/');


accessToken.post(async function(req, res, next) {
	let args = {
		client_id: req.body.client_id,
		client_secret: req.body.client_secret,
		grant_type: req.body.grant_type
	};

	if (args.grant_type === 'authorization_code') {
		args.redirect_uri = req.body.redirect_uri;
		args.code = req.body.code;
	}
	else if (args.grant_type === 'refresh_token') {
		args.refresh_token = req.body.refresh_token;
	}
	else {
		res.json({
			code: 400,
			message: 'grant_type must be one of \'authorization_code\' or \'refresh_token\'.'
		});

		return;
	}

	let result = await OAuthTokenTC.getResolver('token').resolve({
		args: args
	});

	if (result instanceof httpErrors.HttpError) {
		res.json({
			code: 400,
			message: result.message
		});
	}
	else {
		res.json(result);
	}
});

module.exports = router;
