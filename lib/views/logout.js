'use strict';

import config from 'config';
import express from 'express';

import { Remove } from '../sessions.js';

let router = express.Router();
let logout = router.route('/');

let domain = config.domain;


logout.get(function(req, res, next) {
	Remove(req)
		.then(function() {
			res.clearCookie(config.sessions.cookieName, {
				domain: domain,
				httpOnly: true
			});

			return res.redirect('https://' + config.appDomain);
		})
		.catch(function(err) {
			next(err);
		});
});

export default router;
