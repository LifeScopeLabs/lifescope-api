import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import schema from './data/schema';

const URL = process.env.PROJECT_DOMAIN
const PORT = process.env.PORT;
const MONGO_URL = 'mongodb://localhost:27017/blog'


const mongoose = require('./config/mongoose');

const db = mongoose();
const app = express();

app.use('*', cors());

const userSchema = require('./graphql/index').userSchema;
app.use('/graphql', cors(), graphqlExpress({
  schema: userSchema,
  rootValue: global,
  graphiql: true
}));

// Up and Running at Port 4000
app.listen(process.env.PORT || 4000, () => {
  console.log('A GraphQL API running at port 4000');
});