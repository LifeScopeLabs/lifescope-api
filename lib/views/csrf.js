'use strict';

import express from 'express';

import csrf from '../middleware/csrf';

let router = express.Router();
let csrfRoute = router.route('/');


async function csrfHandler(req, res) {
	res.json({
		csrf_token: res.context.csrf_token
	});
}

csrfRoute.get(csrf.create, csrfHandler);

export default router
