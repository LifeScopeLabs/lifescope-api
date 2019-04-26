'use strict';

const _ = require('lodash');
const mongodb = require('mongodb');
const config = require('config');


(function() {
	let db;

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
	})
	.then(function() {
		return Promise.all([
			// `associations` Collection
			db.db('live').collection('association_sessions').createIndex({
				token: 1
			}, {
				unique: true
			}),

			db.db('live').collection('association_sessions').createIndex({
				connection_id: 1
			}, {
				unique: true
			}),

			db.db('live').collection('association_sessions').createIndex({
				ttl: 1
			}, {
				expireAfterSeconds: 0
			}),

			// `sessions` Collection
			db.db('live').collection('sessions').createIndex({
				created: 1
			}),

			db.db('live').collection('sessions').createIndex({
				expires: 1
			}),

			db.db('live').collection('sessions').createIndex({
				login: 1
			}),

			db.db('live').collection('sessions').createIndex({
				logout: 1
			}),

			db.db('live').collection('sessions').createIndex({
				token: 1
			}, {
				unique: true
			}),

			db.db('live').collection('sessions').createIndex({
				ttl: 1
			}, {
				expireAfterSeconds: 0
			}),

			db.db('live').collection('sessions').createIndex({
				user_id: 1
			}),

			// `connections` collection
			db.db('live').collection('connections').createIndex({
				enabled: 1
			}),

			db.db('live').collection('connections').createIndex({
				last_run: 1
			}),

			db.db('live').collection('connections').createIndex({
				last_successful_run: 1
			}),

			db.db('live').collection('connections').createIndex({
				provider_id: 1
			}),

			db.db('live').collection('connections').createIndex({
				provider_name: 1
			}),

			db.db('live').collection('connections').createIndex({
				remote_connection_id: 1
			}),

			db.db('live').collection('connections').createIndex({
				status: 1
			}),

			db.db('live').collection('connections').createIndex({
				user_id: 1
			}),

			// `events` collection
			db.db('live').collection('events').createIndex({
				type: 'text',
				provider_name: 'text',
			}),

			db.db('live').collection('events').createIndex({
				connection_id: 1
			}),

			db.db('live').collection('events').createIndex({
				contact_interaction_type: 1
			}),

			db.db('live').collection('events').createIndex({
				datetime: 1
			}),

			db.db('live').collection('events').createIndex({
				provider_id: 1
			}),

			db.db('live').collection('events').createIndex({
				provider_name: 1
			}),

			db.db('live').collection('events').createIndex({
				type: 1
			}),

			db.db('live').collection('events').createIndex({
				user_id: 1
			}),

			// `locations` collection
			db.db('live').collection('locations').createIndex({
				datetime: 1
			}),

			db.db('live').collection('locations').createIndex({
				estimated: 1
			}),

			db.db('live').collection('locations').createIndex({
				identifier: 1
			}),

			db.db('live').collection('locations').createIndex({
				user_id: 1
			}),

			// `contacts` collection
			db.db('live').collection('contacts').createIndex({
				handle: 'text',
				name: 'text'
			}),

			db.db('live').collection('contacts').createIndex({
				connection_id: 1
			}),

			db.db('live').collection('contacts').createIndex({
				handle: 1
			}),

			db.db('live').collection('contacts').createIndex({
				name: 1
			}),

			db.db('live').collection('contacts').createIndex({
				provider_id: 1
			}),

			db.db('live').collection('contacts').createIndex({
				user_id: 1
			}),

			db.db('live').collection('content').createIndex({
				type: 'text',
				file_extension: 'text',
				owner: 'text',
				title: 'text',
				text: 'text',
				url: 'text'
			}),

			db.db('live').collection('content').createIndex({
				connection_id: 1
			}),

			db.db('live').collection('content').createIndex({
				connection_id: 1
			}),

			db.db('live').collection('content').createIndex({
				provider_id: 1
			}),

			db.db('live').collection('content').createIndex({
				type: 1
			}),

			db.db('live').collection('content').createIndex({
				user_id: 1
			}),

			// `people` collection
			db.db('live').collection('people').createIndex({
				first_name: 'text',
				middle_name: 'text',
				last_name: 'text'
			}),

			db.db('live').collection('people').createIndex({
				user_id: 1
			}),

			// `providers` collection
			db.db('live').collection('providers').createIndex({
				enabled: 1
			}),

			db.db('live').collection('providers').createIndex({
				remote_map_id: 1
			}),

			// `searches` collection
			db.db('live').collection('searches').createIndex({
				count: 1
			}),

			db.db('live').collection('searches').createIndex({
				last_run: 1
			}),

			db.db('live').collection('searches').createIndex({
				name: 1
			}),

			db.db('live').collection('searches').createIndex({
				user_id: 1
			}),

			// `tags` collection
			db.db('live').collection('tags').createIndex({
				user_id: 1
			}),

			// `users` Collection
			db.db('live').collection('users').createIndex({
				last_location_estimation: 1
			}),

			// `users` Collection
			db.db('live').collection('users').createIndex({
				location_estimation_status: 1
			}),
		]);
	})
	.then(function() {
		console.log('Index Migrations Succeeded.');

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
