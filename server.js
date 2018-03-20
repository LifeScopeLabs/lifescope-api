import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import mongoose from 'mongoose';

import cookieAuthorization from './middleware/cookie-authorization';
import lifescopeSchema from './schema';

const MONGODB_URI = process.env.MONGODB_URI;

const Schema = mongoose.Schema;
const server = express();
const opts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
};

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

server.use(
  lifescopeSchema.uri, 
  bodyParser.json(), 
  cookieParser(),
  cookieAuthorization,
  graphqlExpress({ 
    schema: lifescopeSchema.schema, 
    tracing: true,
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
  }));

// http://localhost:3000/gql-i/
server.get(`${lifescopeSchema.uri}-i`, graphiqlExpress({ endpointURL: lifescopeSchema.uri }));

// http://localhost:3000/gql-p/
server.get(`${lifescopeSchema.uri}-p`, expressPlayground({ endpoint: lifescopeSchema.uri }));

// http://localhost:3000/user/
server.listen(process.env.PORT);

console.log('PORT: ' + process.env.PORT);
