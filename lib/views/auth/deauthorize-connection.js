/* global env */
'use strict';

import crypto from 'crypto';

import express from 'express';

import { ConnectionTC } from '../../../schema/models/connections.js';
import { ProviderTC } from '../../../schema/models/providers.js';
import { UserTC } from '../../../schema/models/users.js';

let router = express.Router();
let deauth = router.route('/:providerId');

let algorithmMap = {
	facebook: 'sha256',
	instagram: 'sha256'
};


deauth.post(async function(req, res) {
	let algorithm, appSecret, data, encodedPayload, encodedSignature, expectedSignature, payload, signature, split;

	let providerId = req.params.providerId;
	let filter = {};

	let bitscoop = env.bitscoop;

	let provider = await ProviderTC.getResolver('providerWithMapOne').resolve({
		args: {
			filter: {
				id: providerId
			}
		}
	});

	let signedRequest = req.body.signed_request;


	if (provider.name === 'Facebook') {
		split = signedRequest.split('.');
		encodedSignature = split[0];
		encodedPayload = split[1];

		let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

		appSecret = map.auth.auth_secret;

		algorithm = algorithmMap.facebook;

		signature = Buffer.from(encodedSignature, 'base64').toString('hex');
		payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');

		data = JSON.parse(payload);

		expectedSignature = crypto.createHmac(algorithm, appSecret).update(encodedPayload).digest('hex');

		if (signature !== expectedSignature) {
			console.log('Deauthorize signatures do no match'); //eslint-disable-line no-console
			console.log(signature); //eslint-disable-line no-console
			console.log(expectedSignature); //eslint-disable-line no-console

			return res.json({
				code: 400,
				message: 'Bad signed JSON signature'
			});
		}
	}
	else if (provider.name === 'Instagram') {
		split = signedRequest.split('.');
		encodedSignature = split[0];
		encodedPayload = split[1];

		let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

		appSecret = map.auth.auth_secret;

		algorithm = algorithmMap.instagram;

		signature = Buffer.from(encodedSignature, 'base64').toString('hex');
		payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');

		data = JSON.parse(payload);

		expectedSignature = crypto.createHmac(algorithm, appSecret).update(encodedPayload).digest('hex');

		if (signature !== expectedSignature) {
			console.log('Deauthorize signatures do no match'); //eslint-disable-line no-console
			console.log(signature); //eslint-disable-line no-console
			console.log(expectedSignature); //eslint-disable-line no-console

			return res.json({
				code: 400,
				message: 'Bad signed JSON signature'
			});
		}
	}

	let userId = data.user_id;

	if (provider.name === 'Facebook') {
		filter = {
			metadata: {
				id: userId
			}
		}
	}
	else if (provider.name === 'Instagram') {
		filter = {
			metadata: {
				id: userId
			}
		}
	}

	let connection = await ConnectionTC.getResolver('findOne').resolve({
		args: {
			filter: filter
		}
	});

	let user = await UserTC.getResolver('findOne').resolve({
		args: {
			filter: {
				id: connection.user_id.toString('hex')
			}
		}
	});

	req.user = user;

	await ConnectionTC.getResolver('patchConnection').resolve({
		args: {
			id: connection._id.toString('hex'),
			forceUnauthorized: true
		},
		context: {
			req: req
		}
	});
});

export default router;
