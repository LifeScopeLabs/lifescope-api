'use strict';

import Mandrill from 'mandrill-api/mandrill.js';
import _ from 'lodash';
import config from 'config';


let mandrill = new Mandrill.Mandrill(config.mandrill.key);


export default class EmailClient {
	constructor() {}

	async send(email, options = {}) {

		let globalMergeVars = [];

		_.forEach(options.context, function(value, name) {
			globalMergeVars.push({
				name: name,
				content: value
			});
		});

		let message = {
			to: [{
				email: email
			}],
			merge: true,
			merge_language: 'handlebars',
			global_merge_vars: globalMergeVars
		};

		return new Promise(function(resolve, reject) {
			mandrill.messages.sendTemplate({
				message: message,
				template_name: options.template,
				template_content: []
			}, resolve, function(errObj) {
				let err = new Error(errObj.message);

				err.code = errObj.code;

				reject(err);
			});
		})
			.then(function() {
				return Promise.resolve();
			})
			.catch(function(err) {
				console.log(err); //eslint-disable-line no-console

				return Promise.reject(err);
			});
	}
}