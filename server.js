import BitScoop from 'bitscoop-sdk';
import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import mongoose from 'mongoose';

import completeConnection from './lib/rest/complete-connection';
import cookieAuthorization from './middleware/cookie-authorization';
import { crudAPI } from './schema';
import validator from './lib/validator';

const MONGODB_URI = process.env.MONGODB_URI;

const Schema = mongoose.Schema;
const server = express();
const opts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
};

const bitscoop = new BitScoop(process.env.BITSCOOP_API_KEY, {
	allowUnauthorized: true
});

server.use(cors());

mongoose.connect(MONGODB_URI, opts);

const mongooseConnect = mongoose.connection;


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

validator.load(config.validationSchemas)
  .then(async function(validate) {
    global.env = {
      bitscoop: bitscoop,
      validate: validate
    };
    
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
  
    server.get('/connections/complete', completeConnection);
  

    // http://localhost:3000/user/
    server.listen(process.env.PORT);

    console.log('PORT: ' + process.env.PORT);
  })
