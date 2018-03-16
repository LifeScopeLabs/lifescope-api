import express from 'express';
import cors from 'cors';
import graphqlHTTP from 'express-graphql';
import expressPlayground from 'graphql-playground-middleware-express';
import mongoose from 'mongoose';

import lifescopeSchema from './schema/lifescope'

const MONGODB_URI = process.env.MONGODB_URI;

const server = express();
server.use(cors());

mongoose.Promise = Promise;

const opts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
};

mongoose.connect(MONGODB_URI, opts);

const mongoConnection = mongoose;

mongoConnection.on('error', e => {
  if (e.message.code === 'ETIMEDOUT') {
    console.log(e);
    mongoose.connect(MONGODB_URI, opts);
  }
  console.log(e);
});

mongoConnection.once('open', () => {
  console.log(`MongoDB successfully connected to ${MONGODB_URI}`);
});

server.use(
    lifescopeSchema.uri,
    graphqlHTTP(() => ({
      schema: lifescopeSchema.schema,
      graphiql: true,
      formatError: error => ({
        message: error.message,
        stack: !error.message.match(/for security reason/i) ? error.stack.split('\n') : null,
      }),
    }))
);
