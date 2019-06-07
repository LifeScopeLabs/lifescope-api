import AWS from 'aws-sdk';
import config from 'config';
import express from 'express';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import csrf from '../../middleware/csrf';
import multipartParser from '../../middleware/multipart-parser';
import uuid from '../../util/uuid';


const AWSAccessKeyId = config.aws.credentials.AWSAccessKeyId;
const AWSSecretKey = config.aws.credentials.AWSSecretKey;


const AWSConfig = {
	"accessKeyId": AWSAccessKeyId,
	"secretAccessKey": AWSSecretKey,
	"region": 'us-east-1'
};

// Set aws config
AWS.config.update(AWSConfig);

let s3 = new AWS.S3({apiVersion: '2006-03-01'});

let router = express.Router();

let uploadFile = router.route('/');


async function uploadHandler(req, res) {
	let body;
	res.type('json');

	try {
		body = JSON.parse(req.file.buffer);
	}
	catch (err) {
		return httpErrors(400, 'Invalid JSON');
	}

	if (!body.locations) {
		return httpErrors(400, 'File does not have field \'locations\' on its top level');
	}

	if (!Array.isArray(body.locations)) {
		return httpErrors(400, 'File.locations is not an array');
	}

	let startTime = moment().utc();

	new Promise(function(resolve, reject) {
		s3.upload({
			Bucket: config.aws.s3.locations.bucket_name,
			Key: req.user._id.toString('hex') + '/' + startTime.unix() + '.json',
			Body: req.file.buffer
		}, async function(err) {
			if (err) {
				reject(err);
			}
			else {
				// let endTime = moment().utc();

				try {
					await mongoose.connection.db.collection('location_files').insert({
						_id: uuid(uuid()),
						upload_time: startTime.toDate(),
						queue_time: startTime.toDate(),
						status: 'ready',
						user_id: req.user._id
					});
				}
				catch (err) {
					// console.log('Queue insert failed');
					console.log(err);

					reject(err);
				}

				// console.log('Finished upload at ' + endTime.toString());
				// console.log('Total upload time: ' + endTime.diff(startTime, 'seconds') + ' seconds');

				resolve();
			}
		});
	});

	res.sendStatus(204);
}

uploadFile.post(csrf.validate, multipartParser, uploadHandler);


export default router;