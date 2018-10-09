'use strict';

const _ = require('lodash');
const httpErrors = require('http-errors');
const multer = require('multer');


let upload = multer({
	storage: multer.memoryStorage()
});


module.exports = function(req, res, next) {
	upload.single('spec')(req, res, function() {
		if (_.has(req, 'file.buffer')) {
			next();
		}
		else {
			next(httpErrors(400, 'You must upload exactly one file.'));
		}
	});
};
