import _ from 'lodash';
import csvParser from 'neat-csv';
import express from 'express';
import httpErrors from 'http-errors';
import mongoose from 'mongoose';

import { ConnectionTC } from '../../../schema/models/connections';
import { EventTC } from '../../../schema/models/events';
import csrf from '../../middleware/csrf';
import multipartParser from '../../middleware/multipart-parser';
import uuid from '../../util/uuid';
import { ProviderTC } from '../../../schema/models/providers';

let router = express.Router();

let uploadFile = router.route('/');


let financialProviderId = 'd2b24c35ffbb47d694ec7a2951247c88';
let tagRegex = /#[^#\s]+/g;


async function uploadHandler(req, res) {
	try {
		let body;
		res.type('json');

		try {
			body = await csvParser(req.file.buffer);
		}
		catch (err) {
			return httpErrors(400, 'Invalid CSV file');
		}

		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: financialProviderId
				}
			}
		});

		if (provider == null) {
			throw new httpErrors(404);
		}

		await mongoose.connection.db.collection('connections').updateOne({
				provider_id: provider._id,
				user_id: req.user._id
			},
			{
				$setOnInsert: {
					_id: uuid(uuid()),
					auth: {
						status: {
							authorized: true,
							complete: true
						}
					},
					frequency: 1,
					enabled: true,
					runnable: false,
					provider_name: 'Financial Files',
					provider_id: provider._id,
					user_id: req.user._id
				}
			},
			{
				upsert: true
			});

		let connection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					provider_id_string: provider._id.toString('hex'),
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		let events = [];

		_.each(body, function(item) {
			let newTags = [];

			let newContent = {
				connection_id_string: connection.id,
				provider_id_string: connection.provider_id_string,
				identifier: connection.id + ':::' + item.Date + ':::' + item['Original Description'] + ':::' + item.Amount,
				tagMasks: {
					source: []
				},
				title: item.Description,
				type: 'receipt',
				price: parseFloat(item.Amount)
			};

			if (item.Labels && typeof item.Labels === 'string') {
				let tags = item.Labels.match(tagRegex);

				if (tags != null) {
					for (let j = 0; j < tags.length; j++) {
						let tag = tags[j].slice(1);

						let newTag = {
							tag: tag,
							user_id: connection.user_id
						};

						if (newTags.indexOf(newTag.tag) === -1) {
							newTags.push(newTag.tag);
						}
					}

					newContent.tagMasks.source = newTags;
				}
			}

			let newEvent = {
				connection_id_string: connection.id,
				provider_id_string: connection.provider_id_string,
				content: [newContent],
				datetime: new Date(item.Date),
				provider_name: 'Financial Files',
				tagMasks: {
					source: []
				},
				type: 'viewed'
			};

			if (item.Notes) {
				newContent.text = item.Notes;
			}

			if (item['Transaction Type'] === 'debit') {
				newEvent.identifier = connection.id + ':::purchased:::' + item.Date + item['Original Description'] + ':::' + item.Amount;
				newEvent.context = 'purchased';
			}
			else {
				newEvent.identifier = connection.id + ':::received money:::' + item.Date + item['Original Description'] + ':::' + item.Amount;
				newEvent.context = 'received money';
			}

			events.push(newEvent);
		});

		await EventTC.getResolver('bulkUpload').resolve({
			args: {
				events: JSON.stringify(events)
			},
			context: {
				req: req
			}
		});

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);

		res.sendStatus(400);
	}
}

uploadFile.post(csrf.validate, multipartParser, uploadHandler);


export default router;