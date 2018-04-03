'use strict';

import express from 'express';

import complete from './complete';


let router = express.Router();

router.use('/complete', complete);


export default router;