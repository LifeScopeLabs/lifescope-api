'use strict';

import config from 'config';
import express from 'express';

import csrf from '../middleware/csrf';

let router = express.Router();
let csrfRoute = router.route('/');

let domain = config.domain;


async function csrfHandler(req, res, next) {
	res.json({
		csrf_token: res.context.csrf_token
	});
}

csrfRoute.get(csrf.create, csrfHandler);

export default router
