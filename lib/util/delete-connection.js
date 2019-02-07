import _ from 'lodash';
import httpErrors from 'http-errors';

import uuid from '../../lib/util/uuid';

import { ContactTC} from "../../schema/models/contacts";
import { ConnectionTC } from "../../schema/models/connections";
import { ContentTC } from "../../schema/models/content";
import { EventTC } from "../../schema/models/events";
import { LocationTC } from "../../schema/models/locations";
import { PeopleTC } from '../../schema/models/people';
import { ThingTC } from "../../schema/models/things";


let typeComposers = [
	ContactTC,
	ContentTC,
	EventTC,
	LocationTC,
	ThingTC
];


export default async function(connectionId, userId) {
	let bitscoop = env.bitscoop;

	let connection = await ConnectionTC.getResolver('findOne').resolve({
		args: {
			filter: {
				id: connectionId,
				user_id_string: userId
			}
		}
	});

	if (!connection) {
		throw new httpErrors(404);
	}

	if (connection.remote_connection_id) {
		let bitscoopConnectionId = connection.remote_connection_id.toString('hex');

		try {
			await bitscoop.deleteConnection(bitscoopConnectionId);
		} catch(err) {
			console.log('Bad BitScoop Connection ID for ' + connection._id.toString('hex'));
		}
	}


	let terms = {
		user_id_string: userId,
		connection_id_string: connectionId
	};

	let selfContact = await ContactTC.getResolver('findOne').resolve({
		args: {
			filter: {
				self: true,
				user_id_string: userId,
				connection_id_string: connectionId
			}
		}
	});

	let promise = Promise.resolve();

	if (selfContact) {
		let selfPerson = await PeopleTC.getResolver('findOne').resolve({
			args: {
				filter: {
					self: true,
					user_id_string: userId
				}
			}
		});

		if (selfPerson) {
			let contactIds = selfPerson.contact_ids;

			_.remove(contactIds, function(contactId) {
				return contactId.toString('hex') === selfContact._id.toString('hex');
			});

			promise = promise.then(function() {
				return PeopleTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							self: true,
							user_id_string: userId
						},
						record: {
							contact_ids: contactIds
						}
					}
				})
			});
		}
	}

	await promise;

	_.each(typeComposers, async function(composer) {
		await composer.getResolver('removeMany').resolve({
			args: {
				filter: terms
			}
		});
	});

	await ConnectionTC.getResolver('removeOne').resolve({
		args: {
			filter: {
				id: connectionId,
				user_id_string: userId
			}
		}
	});
}

