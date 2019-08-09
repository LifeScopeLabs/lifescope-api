'use strict';

import express from 'express';

import confirm from './confirm.js';


let router = express.Router();

router.use('/confirm', confirm);


export default router;