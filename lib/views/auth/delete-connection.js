/* global env */
'use strict';

import crypto from 'crypto';

import config from 'config';
import express from 'express';

import uuid from '../../../lib/util/uuid.js';

import { ConnectionTC } from '../../../schema/models/connections.js';
import { DataRemovalConfirmationsTC } from '../../../schema/models/data-removal-confirmations.js';
import { ProviderTC } from '../../../schema/models/providers.js';
import { UserTC } from '../../../schema/models/users.js';

let router = express.Router();
let deauth = router.route('/:providerId');

let dataRemovalProviders = [
	'Facebook',
	'Instagram'
];

let algorithmMap = {
	facebook: 'sha256',
	instagram: 'sha256'
};


deauth.post(async function(req, res) {
	let algorithm, appSecret;

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

	let split = signedRequest.split('.');
	let encodedSignature = split[0];
	let encodedPayload = split[1];

	if (provider.name === 'Facebook') {
		let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

		appSecret = map.auth.auth_secret;

		algorithm = algorithmMap.facebook;
	}
	else if (provider.name === 'Instagram') {
		let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

		appSecret = map.auth.auth_secret;

		algorithm = algorithmMap.instagram;
	}

	let signature = Buffer.from(encodedSignature, 'base64').toString('hex');
	let payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');

	let data = JSON.parse(payload);

	let expectedSignature = crypto.createHmac(algorithm, appSecret).update(encodedPayload).digest('hex');

	if (signature !== expectedSignature) {
		console.log('Data Deletion signatures do no match'); //eslint-disable-line no-console
		console.log(signature); //eslint-disable-line no-console
		console.log(expectedSignature); //eslint-disable-line no-console

		return res.json({
			code: 400,
			message: 'Bad signed JSON signature'
		});
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

	await ConnectionTC.getResolver('eliminateConnection').resolve({
		args: {
			id: connection._id.toString('hex'),
			overrideLastLoginConnection: true
		},
		context: {
			req: req,
			res: res
		}
	});

	await new Promise(async function(resolve) {
		if (dataRemovalProviders.indexOf(provider.name) > -1) {
			let id = uuid();
			let confirmationCode = uuid();

			await DataRemovalConfirmationsTC.getResolver('createOne').resolve({
				args: {
					record: {
						id: id,
						connection_id_string: connection._id.toString('hex'),
						confirmation_code_string: confirmationCode,
						provider_name: connection.provider_name
					}
				}
			});

			res.json({
				url: 'https://' + config.appDomain + '/deletion-confirm?confirmation_code=' + confirmationCode,
				confirmation_code: confirmationCode
			});

			resolve();
		}
		else {
			res.sendStatus(200);

			resolve();
		}
	});
});

export default router;
