/* @flow */

import { SchemaComposer } from 'graphql-compose';
import uuid from 'uuid/v4';

import restrictToUser from '../middleware/restrict-to-user';
import { ConnectionTC } from './models/connections';
// import { ProviderTC } from './models/providers';
import { SessionTC } from './models/session';

import { UserTC } from './models/user';

const GQC = new SchemaComposer();

const { Resolver } = GQC;

// create GraphQL Schema with all available resolvers
GQC.rootQuery().addFields({
  //Connections
  // connectionOne: ConnectionTC.getResolver('findOne'),
  // connectionMany: ConnectionTC.getResolver('findMany'),
//   connectionTotal: ConnectionTC.getResolver('count'),
//   connectionConnection: ConnectionTC.getResolver('connection'),
//   connectionPagination: ConnectionTC.getResolver('pagination'),
});
// For debug purposes you may display resolver internals in the following manner:
// console.log(UserTC.getResolver('findMany').toString());

GQC.rootMutation().addFields({
  
  // Connections
  connectionCreate: ConnectionTC.getResolver('createOne'),
  // connectionUpdateOne: ConnectionTC.getResolver('updateOne'),
  // connectionUpdateMany: ConnectionTC.getResolver('updateMany'),
  // connectionRemoveOne: ConnectionTC.getResolver('removeOne'),
  // connectionRemoveMany: ConnectionTC.getResolver('removeMany'),
});

const graphqlSchema = GQC.buildSchema();

export const sessionAPI = graphqlSchema;