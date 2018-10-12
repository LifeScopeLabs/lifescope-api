import express from 'express';

import connections from './connections';
import financials from './financials';
import locations from './locations';
import logout from './logout';


let router = express.Router();


router.use('/connections', connections);
router.use('/financials', financials);
router.use('/locations', locations);
router.use('/logout', logout);

router.use('/health', function(req, res, next) {
	res.sendStatus(204);
});

// router.use('/$', require('./home'));


export default router;