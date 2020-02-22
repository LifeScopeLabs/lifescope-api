'use strict';

import crypto from 'crypto';
import _ from 'lodash';
import moment from 'moment';

import { readFile } from './fs.js';
import uuid from './uuid.js';
import sortDictionary from './sort-dictionary.js';
import { SearchTC } from '../../schema/models/searches.js';
import { UserTC } from '../../schema/models/users.js';


let initialSearches = readFile('fixtures/searches/initial_searches.json');


async function createInitialSearches(userId) {
	let data = await initialSearches;

	let searches = JSON.parse(data);

	let promises = _.map(searches, async function(search) {
		let unnamedFilters = _.map(search.filters, function(filter) {
			return _.omit(filter, 'name');
		});

		let hashObj = {
			filters: unnamedFilters
		};

		if (search.query != null) {
			hashObj.query = search.query;
		}

		let sorted = sortDictionary(hashObj);
		let hash = crypto.createHash('sha512').update(JSON.stringify(sorted)).digest('hex');

		let existing = await SearchTC.getResolver('findOne').resolve({
			args: {
				filter: {
					hash: hash,
					user_id_string: userId
				}
			}
		});

		if (existing == undefined) {
			return SearchTC.getResolver('createOne').resolve({
				args: {
					record: {
						id: uuid(),
						count: 1,
						last_run: moment.utc().toDate(),
						filters: search.filters,
						hash: hash,
						user_id_string: userId,
						favorited: search.favorited,
						icon: search.icon,
						icon_color: search.icon_color,
						query: search.query,
						name: search.name
					}
				}
			})
		}
		else {
			return Promise.resolve();
		}
	});

	await Promise.all(promises);

	return await UserTC.getResolver('updateOne').resolve({
		args: {
			filter: {
				id: userId
			},
			record: {
				'settings.explorer.initial_searches': true
			}
		}
	});
}

export default createInitialSearches;
