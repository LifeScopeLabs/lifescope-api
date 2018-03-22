import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import mongoose from 'mongoose';

import cookieAuthorization from './middleware/cookie-authorization';
import { crudAPI } from './schema';

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
  crudAPI.uri, 
  bodyParser.json(), 
  cookieParser(),
  cookieAuthorization,
  graphqlExpress((req) => ({ 
    schema: crudAPI.schema, 
    tracing: true,
    context: req,
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

// http://localhost:3000/gql-i/
server.get(`${crudAPI.uri}-i`, graphiqlExpress({ endpointURL: crudAPI.uri }));

// http://localhost:3000/gql-p/
server.get(`${crudAPI.uri}-p`, expressPlayground({ endpoint: crudAPI.uri }));

// http://localhost:3000/user/
server.listen(process.env.PORT);

console.log('PORT: ' + process.env.PORT);
