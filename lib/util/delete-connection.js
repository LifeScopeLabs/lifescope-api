'use strict';

import _ from 'lodash';
import httpErrors from 'http-errors';

import { ContactTC} from "../../schema/models/contacts";
import { ConnectionTC } from "../../schema/models/connections";
import { ContentTC } from "../../schema/models/content";
import { EventTC } from "../../schema/models/events";
import { LocationTC } from "../../schema/models/locations";
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


	await ConnectionTC.getResolver('removeOne').resolve({
		args: {
			filter: {
				id: connectionId,
				user_id_string: userId
			}
		}
	});

	if (connection.remote_connection_id) {
		let bitscoopConnectionId = connection.remote_connection_id.toString('hex');

		await bitscoop.deleteConnection(bitscoopConnectionId);
	}


	let terms = {
		user_id_string: userId,
		connection_id_string: connectionId
	};

	_.each(typeComposers, async function(composer) {
		await composer.getResolver('removeMany').resolve({
			args: {
				filter: terms
			}
		});
	});
}

