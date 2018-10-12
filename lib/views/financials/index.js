'use strict';

import express from 'express';

import uploadFile from './upload-file';


let router = express.Router();

router.use('/upload_file', uploadFile);


export default router;