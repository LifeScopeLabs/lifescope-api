import fs from 'fs';

import glob from 'glob';


export const find = function(pattern, options) {
	return new Promise(function(resolve, reject) {
		glob(pattern, options, function(err, files) {
			if (err) {
				reject(err);
			}
			else {
				resolve(files);
			}
		});
	});
};

export const readFile = function(name) {
	return new Promise(function(resolve, reject) {
		fs.readFile(name, function(err, buffer) {
			if (err) {
				reject(err);
			}
			else {
				resolve(buffer);
			}
		});
	});
};