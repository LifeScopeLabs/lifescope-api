'use strict';

import _ from 'lodash';
import httpErrors from 'http-errors';
import moment from 'moment';

import uuid from '../../../lib/utl/uuid';
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
					record: {
						updated: moment.utc().toDate()
					}
				}
			})
		}
		else {
			await TagTC.getResvoler('createOne').resolve({
				args: {
					record: {
						id: uuid(),
						created: moment.utc().toDate(),
						updated: moment.utc().toDate()
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

	let data = await TypeTC.getResolver('updateOne').resolve({
		args: {
			filter: filter,
			$addToSet: {
				'tagMasks.added': {
					$each: req.body.tags
				}
			},
			$pull: {
				'tagMasks.removed': {
					$in: req.body.tags
				}
			}
		}
	});

	console.log(data);

	if (data.result.n === 0) {
		throw new httpErrors(404);
	}

	return await TypeTC.getResolver('findOne').resolve({
		args: {
			filter: filter
		}
	});
};


export const remove = async function(req, args, TypeTC) {
	let hexId = args.id;
	let validate = env.validate;

	try {
		await validate('#/types/uuid4', hexId)
	} catch(err) {
		throw httpErrors(404);
	}

	_.each(args.tags, async function(tag) {
		await TagTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					tag: tag,
					user_id: req.user._id
				},
				$set: {
					updated: moment.utc().toDate()
				},
				$setOnInsert: {
					_id: gid(),
					created: moment.utc().toDate(),
					tag: tag
				}
			},
			opts: {
				upsert: true
			}
		});
	});

	let filter = {
		id: hexId,
		user_id_string: req.user._id.toString('hex')
	};

	let data = await TypeTC.getResolver('updateOne').resolve({
		args: {
			filter: filter,
			$addToSet: {
				'tagMasks.removed': {
					$each: req.body.tags
				}
			},
			$pull: {
				'tagMasks.added': {
					$in: req.body.tags
				}
			}
		}
	});

	if (data.result.n === 0) {
		throw new httpErrors(404);
	}

	return await TypeTC.getResolver('findOne').resolve({
		args: {
			filter: filter
		}
	});
};