'use strict';

import express from 'express';

import accessToken from './access-token';


let router = express.Router();

router.use('/access_token', accessToken);


export default router;