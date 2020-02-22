'use strict';

import uuid from '../util/uuid.js';


export default function(req, res, next) {
	req.meta = {
		id: uuid(),
		ip: req.realIp,
		method: req.method,
		path: req.originalUrl
	};

	next();
}
