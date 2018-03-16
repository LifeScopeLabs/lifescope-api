const express = require('express');

const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const expressPlayground = require('graphql-playground-middleware-express');
const mongoose = require('mongoose');

const lifescopeSchema = require('./schema');

const MONGODB_URI = process.env.MONGODB_URI;

const server = express();
server.use(cors());

const opts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
};

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
    lifescopeSchema.default.uri,
    graphqlHTTP(() => ({
      schema: lifescopeSchema.schema,
      graphiql: true,
      formatError: error => ({
        message: error.message,
        stack: !error.message.match(/for security reason/i) ? error.stack.split('\n') : null,
      }),
    }))
);
