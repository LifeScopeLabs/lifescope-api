'use strict';

import moment from 'moment';

import { ConnectionTC } from '../../schema/models/connections';
import { OAuthTokenTC } from "../../schema/models/oauth-tokens";
import { UserTC } from '../../schema/models/users';


let re_token = /^Bearer ([a-fA-F0-9]{64})$/;


export default async function(req, res, next) {
	if (req.headers.hasOwnProperty('authorization')) {
		let authorization = req.headers.authorization;
		let tokenMatch = re_token.exec(authorization);
		let tokenString = tokenMatch ? tokenMatch[1] : null;

		let token = await OAuthTokenTC.getResolver('findOne').resolve({
			args: {
				filter: {
					access_token: tokenString
				}
			}
		});

		if (token != null) {
			let expires = new Date(token.expires);

			if (moment().utc().toDate() > expires) {
				res.status(401).send({message: 'Token has expired'});

				return;
			}

			if (token.connection_id) {
				let connection = await ConnectionTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: token.connection_id.toString('hex')
						}
					}
				});

				if (connection.enabled !== true) {
					res.status(401).send({message: 'The Connection associated with this token has been disabled.'});

					return;
				}
			}

			let user = await UserTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: token.user_id.toString('hex')
					}
				}
			});

			req.user = user || null;
			req.scopes = token.scopes;
		}
	}

	next();
}
