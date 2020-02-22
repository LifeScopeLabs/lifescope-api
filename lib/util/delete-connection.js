/* global env */

import _ from 'lodash';
import httpErrors from 'http-errors';

import { ContactTC } from '../../schema/models/contacts.js';
import { ConnectionTC } from '../../schema/models/connections.js';
import { ContentTC } from '../../schema/models/content.js';
import { EventTC } from '../../schema/models/events.js';
import { LocationTC } from '../../schema/models/locations.js';
import { OAuthTokenTC } from '../../schema/models/oauth-tokens.js';
import { PeopleTC } from '../../schema/models/people.js';
import { ThingTC } from '../../schema/models/things.js';


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
		}
		catch (err) {
			console.log('Bad BitScoop Connection ID for ' + connection._id.toString('hex')); //eslint-disable-line no-console

			// return Promise.reject(err);

			// return Promise.resolve();
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

	let peopleContactRemovalPromises = [];

	let contacts = await ContactTC.getResolver('findMany').resolve({
		args: {
			filter: {
				connection_id_string: connectionId,
				user_id_string: userId
			}
		}
	});

	let contactIdStringList = _.map(contacts, function(contact) {
		return contact._id.toString('hex')
	});

	let people = await PeopleTC.getResolver('findMany').resolve({
		args: {
			filter: {
				contact_id_strings: {
					$in: contactIdStringList
				}
			}
		}
	});

	_.each(people, function(person) {
		_.remove(person.contact_ids, function(id) {
			return contactIdStringList.indexOf(id.toString('hex') > -1);
		});

		peopleContactRemovalPromises.push(PeopleTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: person._id.toString('hex'),
					user_id_string: userId
				},
				record: {
					contact_ids: person.contact_ids
				}
			}
		}))
	});

	await peopleContactRemovalPromises;

	_.each(typeComposers, async function(composer) {
		await composer.getResolver('removeMany').resolve({
			args: {
				filter: terms
			}
		});
	});
	
	await OAuthTokenTC.getResolver('removeMany').resolve({
		args: {
			filter: {
				connection_id_string: connectionId
			}
		}
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

