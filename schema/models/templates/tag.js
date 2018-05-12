'use strict';

import _ from 'lodash';
import httpErrors from 'http-errors';
import moment from 'moment';

import uuid from '../../../lib/util/uuid';
import {TagTC} from "../tags";


export const add = async function(req, args, TypeTC) {
	let hexId = args.id;
	let validate = env.validate;

	try {
		await validate('#/types/uuid4', hexId)
	} catch(err) {
		throw httpErrors(404);
	}

	_.each(args.tags, async function(tag) {
		let tagResult = await TagTC.getResolver('findOne').resolve({
			args: {
				filter: {
					tag: tag,
					user_id: req.user._id.toString('hex')
				}
			}
		});

		if (tagResult) {
			await TagTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						tag: tag,
						user_id: req.user._id.toString('hex')
					},
					record: {
						updated: moment.utc().toDate()
					}
				}
			})
		}
		else {
			await TagTC.getResolver('createOne').resolve({
				args: {
					record: {
						id: uuid(),
						created: moment.utc().toDate(),
						updated: moment.utc().toDate(),
						tag: tag
					}
				}
			})
		}
	});

	let filter = {
		id: hexId,
		user_id_string: req.user._id.toString('hex')
	};

	let data = await TypeTC.getResolver('findOne').resolve({
		args: {
			filter: filter
		}
	});

	let tagMasks = data.tagMasks;

	if (!tagMasks) {
		tagMasks = {};
	}

	if (!tagMasks.added) {
		tagMasks.added = [];
	}

	if (!tagMasks.removed) {
		tagMasks.removed = [];
	}

	if (!tagMasks.source) {
		tagMasks.source = [];
	}

	tagMasks.added = _.union(tagMasks.added, args.tags);
	_.pullAll(tagMasks.removed, args.tags);

	let result = await TypeTC.getResolver('updateOne').resolve({
		args: {
			filter: filter,
			record: {
				tagMasks: tagMasks
			}
		}
	});

	if (result == null) {
		throw new httpErrors(404);
	}

	return result.record;
};


export const remove = async function(req, args, TypeTC) {
	let hexId = args.id;
	let validate = env.validate;

	try {
		await validate('#/types/uuid4', hexId)
	} catch(err) {
		throw httpErrors(404);
	}

	console.log(args);

	_.each(args.tags, async function(tag) {
		let tagResult = await TagTC.getResolver('findOne').resolve({
			args: {
				filter: {
					tag: tag,
					user_id: req.user._id.toString('hex')
				}
			}
		});

		if (tagResult) {
			await TagTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						tag: tag,
						user_id: req.user._id.toString('hex')
					},
					record: {
						updated: moment.utc().toDate()
					}
				}
			})
		}
		else {
			await TagTC.getResolver('createOne').resolve({
				args: {
					record: {
						id: uuid(),
						created: moment.utc().toDate(),
						updated: moment.utc().toDate(),
						tag: tag
					}
				}
			})
		}
	});

	let filter = {
		id: hexId,
		user_id_string: req.user._id.toString('hex')
	};

	let data = await TypeTC.getResolver('findOne').resolve({
		args: {
			filter: filter
		}
	});

	let tagMasks = data.tagMasks;

	if (!tagMasks) {
		tagMasks = {};
	}

	if (!tagMasks.added) {
		tagMasks.added = [];
	}

	if (!tagMasks.removed) {
		tagMasks.removed = [];
	}

	if (!tagMasks.source) {
		tagMasks.source = [];
	}

	tagMasks.removed = _.union(tagMasks.removed, args.tags);
	_.pullAll(tagMasks.added, args.tags);

	console.log(filter);
	console.log(tagMasks);
	let result = await TypeTC.getResolver('updateOne').resolve({
		args: {
			filter: filter,
			record: {
				tagMasks: tagMasks
			}
		}
	});

	if (result == null) {
		throw new httpErrors(404);
	}

	return result.record;
};