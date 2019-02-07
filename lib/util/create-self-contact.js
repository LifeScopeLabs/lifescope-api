import _ from 'lodash';
import httpErrors from 'http-errors';
import moment from 'moment';

import uuid from './uuid';

import { ContactTC} from "../../schema/models/contacts";
import {PeopleTC} from '../../schema/models/people';

let providerMap = {
	dropbox: {
		id: 'account_id',
		handle: 'email',
		name: 'name.display_name'
	},

	facebook: {
		id: 'id',
		handle: 'name'
	},

	github: {
		id: 'login',
		handle: 'login',
		name: 'name',
		avatar_url: 'avatar_url'
	},

	google: {
		id: 'id',
		handle: 'emailAddresses[0].value',
		name: 'names[0].displayName',
		avatar_url: 'coverPhotos[0].url'
	},

	lyft: {
		id: 'id',
		name: 'full_name'
	},

	microsoft: {
		id: 'id',
		handle: 'userPrincipalName',
		name: 'displayName'
	},

	reddit: {
		id: 'id',
		handle: 'name'
	},

	slack: {
		id: 'email',
		handle: 'email',
		name: 'real_name',
		avatar_url: 'image_original'
	},

	spotify: {
		id: 'id',
		name: 'display_name',
		avatar_url: 'images[0].url'
	},

	steam: {
		id: 'id',
		handle: 'personaname',
		name: 'realname',
		avatar_url: 'avatarfull'
	},

	twitter: {
		id: 'id_str',
		name: 'name',
		handle: 'screen_name',
		avatar_url: 'profile_image_url_https'
	},

	uber: {
		id: 'uuid',
		name: 'full_name'
	}
};



export default async function(connection) {
	try {
		let bitscoop = env.bitscoop;

		let userIdString = connection.user_id.toString('hex');

		let bitscoopConnection = await bitscoop.getConnection(connection.remote_connection_id.toString('hex'));
		let metadata = bitscoopConnection.metadata;

		let map = providerMap[connection.provider_name.toLowerCase()];

		if (map != null) {
			let contact = {
				_id: uuid(uuid()),
				identifier: connection._id.toString('hex') + ':::' + connection.provider_name.toLowerCase() + ':::' + _.get(metadata, map.id),
				connection_id: connection._id,
				provider_id: connection.provider_id,
				provider_name: connection.provider_name.toLowerCase(),
				self: true,
				user_id: connection.user_id,
				remote_id: _.get(connection.metadata, map.id)
			};

			if (map.avatar_url) {
				contact.avatar_url = _.get(metadata, map.avatar_url);
			}

			if (map.handle) {
				contact.handle = _.get(metadata, map.handle);
			}

			if (map.name) {
				contact.name = _.get(metadata, map.name);
			}

			let existingContact = await ContactTC.getResolver('findOne').resolve({
				args: {
					filter: {
						identifier: contact.identifier,
						user_id_string: userIdString
					}
				}
			});

			if (existingContact != null) {
				return Promise.resolve();
			}
			else {
				let newContactResult = await ContactTC.getResolver('createOne').resolve({
					args: {
						record: contact
					}
				});

				let newContact = newContactResult.record;

				let selfPerson = await PeopleTC.getResolver('findOne').resolve({
					args: {
						filter: {
							self: true,
							user_id_string: userIdString
						}
					}
				});

				if (selfPerson == null) {
					let record = {
						_id: uuid(uuid()),
						contact_ids: [newContact._id],
						created: moment().utc().toDate(),
						self: true,
						updated: moment().utc().toDate(),
						user_id: connection.user_id
					};

					if (map.avatar_url) {
						record.avatar_url = contact.avatar_url;
					}

					return PeopleTC.getResolver('createOne').resolve({
						args: {
							record: record
						}
					});
				}
				else {
					let contactIds = selfPerson.contact_ids;

					contactIds = contactIds.concat(newContact._id);

					contactIds = _.uniq(contactIds);

					return PeopleTC.getResolver('updateOne').resolve({
						args: {
							filter: {
								self: true,
								user_id_string: userIdString
							},
							record: {
								contact_ids: contactIds,
								updated: moment().utc().toDate()
							}
						}
					});
				}
			}
		}
	} catch(err) {
		console.log(err);

		return Promise.reject(err);
	}
}

