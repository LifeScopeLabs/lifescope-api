'use strict';

const path = require('path');

const _ = require('lodash');
const mongodb = require('mongodb');
const config = require('config');

const fs = require('../lib/util/fs');
const gid = require('../lib/util/gid');


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

		fs.find('./fixtures/providers/*.json')
	])
	.then(function(result) {
		let [, files] = result;

		let inserts = _.map(files, function(file) {
			console.log('Reading Provider information from "' + file + '".');

			return Promise.all([
				fs.readfile(file)
			])
				.then(function(result) {
					let [providerJson] = result;

					let provider = JSON.parse(providerJson);
					if (provider.remote_map_id == null) {
						return Promise.resolve();
					}

					provider._id = gid(provider._id);
					provider.remote_map_id = gid(provider.remote_map_id);

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
