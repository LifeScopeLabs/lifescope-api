import express from 'express';

import auth from './auth';
import connections from './connections';
import csrf from './csrf';
import email from './email';
import financials from './financials';
import locations from './locations';
import login from './login';
import logout from './logout';
import signup from './signup';


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