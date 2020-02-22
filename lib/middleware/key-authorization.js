/* global env */

'use strict';

import { UserTC } from '../../schema/models/users.js';


let re_token = /^Key ([a-fA-F0-9]{32})$/;


export default async function(req, res, next) {
	if (req.user == null && req.headers.hasOwnProperty('authorization')) {
		let authorization = req.headers.authorization;
		let tokenMatch = re_token.exec(authorization);
		let token = tokenMatch ? tokenMatch[1] : null;

		if (token != null) {
			await env.validate('#/types/uuid4', token)
				.catch(function(err) {
					console.log(err); //eslint-disable-line no-console

					throw new Error('Key must be a 32-character UUID4 without dashes')
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
	}

	next();
}
