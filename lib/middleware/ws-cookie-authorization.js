import config from 'config';
import moment from 'moment';

import {SessionTC} from '../../schema/models/sessions';
import {UserTC} from '../../schema/models/users';


export default async function(cookie) {
	let sessionResult = await SessionTC.getResolver('findMany').resolve({
		args: {
			filter: {
				token: cookie,
				expires: {
					$gt: moment.utc().toDate()
				},
				logout: null
			}
		},
		projection: {
			id: true,
			token: true,
			csrf_secret: true,
			expires: true,
			user_id: true,
		}
	});

	if (sessionResult.length > 1) {
		return Promise.reject(new Error('Duplicate session.'));
	}

	if (sessionResult.length === 0) {
		return null;
	}
	else {
		let userResult = await UserTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: sessionResult[0].user_id.toString('hex')
				}
			}
		});

		return userResult || null;
	}
};
