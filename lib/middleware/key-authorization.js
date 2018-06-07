'use strict';

import {UserTC} from '../../schema/models/users';


let re_token = /^Bearer ([a-fA-F0-9]{32})$/;


export default async function(req, res, next) {
	if (req.headers.hasOwnProperty('authorization')) {
		let authorization = req.headers.authorization;
		let tokenMatch = re_token.exec(authorization);
		let token = tokenMatch ? tokenMatch[1] : null;

		await env.validate('#/types/uuid4', token)
			.catch(function (err) {
				throw new Error('token must be a 32-character UUID4 without dashes')
			});

		let user = await UserTC.getResolver('findOne').resolve({
			args: {
				filter: {
					api_key_string: token
				}
			}
		});

		req.user = user || null;
	}

	next();
};
