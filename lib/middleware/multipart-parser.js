'use strict';

import _ from 'lodash';
import httpErrors from 'http-errors';
import multer from 'multer';


let upload = multer({
	storage: multer.memoryStorage()
});


export default function(req, res, next) {
	upload.single('spec')(req, res, function() {
		if (_.has(req, 'file.buffer')) {
			next();
		}
		else {
			next(httpErrors(400, 'You must upload exactly one file.'));
		}
	});
}
