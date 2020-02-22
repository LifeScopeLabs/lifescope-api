import express from 'express';

import auth from './auth/index.js';
import connections from './connections/index.js';
import csrf from './csrf.js';
import email from './email/index.js';
import financials from './financials/index.js';
import locations from './locations/index.js';
import login from './login/index.js';
import logout from './logout.js';
import signup from './signup/index.js';


let router = express.Router();


router.use('/auth', auth);
router.use('/connections', connections);
router.use('/csrf', csrf);
router.use('/email', email);
router.use('/financials', financials);
router.use('/locations', locations);
router.use('/login', login);
router.use('/logout', logout);
router.use('/signup', signup);

router.use('/health', function(req, res) {
	res.sendStatus(204);
});

// router.use('/$', require('./home'));


export default router;