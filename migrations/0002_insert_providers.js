'use strict';

import _ from 'lodash';
import mongodb from 'mongodb';
import config from 'config';

import { find, readFile } from '../lib/util/fs';
import uuid from '../lib/util/uuid';


(function() {
	let db;

	Promise.all([
		new Promise(function(resolve, reject) {
			let address = config.mongodb.address;
			let options = config.mongodb.options;

			mongodb.MongoClient.connect(address, options, function(err, database) {
				if (err) {
					reject(err);
				}
				else {
					db = database;
					resolve();
				}
			});
		}),

		find('./fixtures/providers/*.json')
	])
	.then(function(result) {
		let [, files] = result;

		let inserts = _.map(files, function(file) {
			console.log('Reading Provider information from "' + file + '".');

			return Promise.all([
				readFile(file)
			])
				.then(function(result) {
					let [providerJson] = result;

					let provider = JSON.parse(providerJson);
					if (provider.remote_map_id == null) {
						return Promise.resolve();
					}

					provider._id = uuid(provider._id);
					provider.remote_map_id = uuid(provider.remote_map_id);

					return db.db('live').collection('providers').update({
						_id: provider._id
					}, {
						$setOnInsert: provider
					}, {
						upsert: true
					})
						.then(function(inserted) {
							console.log('New Provider <' + provider._id.toString('hex') + '> inserted.');

							return Promise.resolve(inserted);
						});
				});
		});

		return Promise.all(inserts);
	})
		.then(function() {
			console.log('Provider Migrations Succeeded.');

			db.close();

			return Promise.resolve();
		})
		.catch(function(err) {
			console.log(err);

			if (db) {
				db.close();
			}

			return Promise.reject(err);
		});
})();
