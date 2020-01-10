'use strict';

import express from 'express';

import accessToken from './access-token';
import deauthorizeConnection from './deauthorize-connection';
import deleteConnection from './delete-connection';


let router = express.Router();

router.use('/access_token', accessToken);
router.use('/deauthorize-connection', deauthorizeConnection);
router.use('/delete-connection', deleteConnection);


export default router;