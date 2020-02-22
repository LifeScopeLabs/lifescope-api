'use strict';

import express from 'express';

import accessToken from './access-token.js';
import deauthorizeConnection from './deauthorize-connection.js';
import deleteConnection from './delete-connection.js';


let router = express.Router();

router.use('/access_token', accessToken);
router.use('/deauthorize-connection', deauthorizeConnection);
router.use('/delete-connection', deleteConnection);


export default router;