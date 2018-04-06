import BitScoop from 'bitscoop-sdk';
import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import mongoose from 'mongoose';
import { Nuxt, Builder } from 'nuxt';

import views from './lib/views';
import cookieAuthorization from './lib/middleware/cookie-authorization';
import meta from './lib/middleware/meta';
import { crudAPI } from './schema';
import { loadValidator } from './lib/validator';
import nuxtConfig from './nuxt.config.js';

const MONGODB_URI = config.mongodb.address;
const BITSCOOP_API_KEY = config.bitscoop.api_key;

const server = express();
const opts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
};

const bitscoop = new BitScoop(BITSCOOP_API_KEY, {
	allowUnauthorized: true
});

server.use(cors());

mongoose.connect(MONGODB_URI, opts);

const mongooseConnect = mongoose.connection;

const nuxt = new Nuxt(nuxtConfig);

const builder = new Builder(nuxt);


mongooseConnect.on('error', e => {
  if (e.message.code === 'ETIMEDOUT') {
    console.log(e);
    mongoose.connect(MONGODB_URI, opts);
  }
  console.log(e);
});

mongooseConnect.once('open', () => {
  console.log(`MongoDB successfully connected to ${MONGODB_URI}`);
});

loadValidator(config.validationSchemas)
  .then(async function(validate) {
    global.env = {
      bitscoop: bitscoop,
      validate: validate
    };

    builder.build();

    server.use(
      crudAPI.uri,
      bodyParser.json(),
      cookieParser(),
      cookieAuthorization,
      graphqlExpress((req, res) => ({
        schema: crudAPI.schema,
        tracing: true,
        context: { req, res },
        // formatError: error => ({
        //   message: error.message,
        //   stack: !error.message.match(/for security reason/i) ? error.stack.split('\n') : null,
        // }),
        formatError: error => ({
          message: error.message,
          locations: error.locations,
          stack: error.stack ? error.stack.split('\n') : [],
          path: error.path
        })
    })));

    // server.use(

    // http://localhost:3000/gql-i/
    server.get(`${crudAPI.uri}-i`, graphiqlExpress({ endpointURL: crudAPI.uri }));

    // http://localhost:3000/gql-p/
    server.get(`${crudAPI.uri}-p`, expressPlayground({ endpoint: crudAPI.uri }));

    server.use(nuxt.render);

    server.use(
        '/',
        meta,
        bodyParser.json(),
        cookieParser(),
        cookieAuthorization,
        views
    );

    // http://localhost:3000/user/
    server.listen(3000);

    console.log('PORT: ' + 3000);
  });
