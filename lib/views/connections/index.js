'use strict';

import express from 'express';

import complete from './complete.js';


let router = express.Router();

router.use('/complete', complete);


export default router;