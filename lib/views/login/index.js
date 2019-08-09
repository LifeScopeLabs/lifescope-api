'use strict';

import express from 'express';

import exchangeCode from './exchange-code.js';
import sendEmail from './send-email.js';


let router = express.Router();

router.use('/exchange-code', exchangeCode);
router.use('/send-email', sendEmail);


export default router;