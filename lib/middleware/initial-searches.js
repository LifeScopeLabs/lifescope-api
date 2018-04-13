'use strict';

import _ from 'lodash';

import createInitialSearches from '../util/create-initial-searches';


export default async function(req, res, next) {
	if (!req.user || req.method !== 'GET') {
		next();
	}
	else {
		let hasInitialSearches = _.get(req.user, 'settings.explorer.initial_searches', false);

		if (hasInitialSearches !== true) {
			await createInitialSearches(req.user._id.toString('hex'));
		}

		next();
	}
};
