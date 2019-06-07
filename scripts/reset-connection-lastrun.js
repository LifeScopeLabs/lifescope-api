'use strict';

import mongodb from 'mongodb';
import config from 'config';


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
	])
	.then(async function() {
		return db.db('live').collection('connections').updateMany({}, {
			$unset: {
				last_run: '',
				last_successful_run: ''
			},
			$set: {
				status: 'ready'
			}
		});
	})
		.then(function() {
			console.log('All Connections\' last_run reset');

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
