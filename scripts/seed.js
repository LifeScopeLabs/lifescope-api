/* @flow */
/* eslint-disable no-await-in-loop */
// This script scans `schema/data` folder for `schema/data/seed.js` files and run them for seeding DB.

import { MongoClient } from 'mongodb';

import path from 'path';
import fs from 'fs';

let db;

async function run() {
  db = await MongoClient.connect(process.env.MONGODB_URI, { promiseLibrary: Promise });

  console.log(`Starting seed...`);

  const seedFile = path.resolve('./schema/data/seed.js');
  try {
    await new Promise((resolve, reject) => {
      fs.access(seedFile, fs.F_OK, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // $FlowFixMe
    const seedFn = require(seedFile).default;
    await seedFn(db); // eslint-disable-line
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' || e.code === 'ENOENT') {
      console.log(`  file '${seedFile}' not found. Skipping...`);
    } else {
      console.log(e);
    }
  }

  console.log('Seed competed!');
  db.close();
}

run().catch(e => {
  console.log(e);
  process.exit(0);
});