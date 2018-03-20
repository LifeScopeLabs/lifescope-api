/* @flow */

import { SchemaComposer } from 'graphql-compose';

// import { ConnectionTC } from './models/connections';
// import { ContactTC } from './models/contacts';
// import { ContentTC } from './models/content';
// import { EventTC } from './models/events';
// import { LocationTC } from './models/locations';
// import { ProviderTC } from './models/providers';
// import { SearchTC } from './models/searches';
// import { SessionTC } from './models/session';
// import { TagTC } from './models/tags';
// import { ThingTC } from './models/things';

import { UserTC } from './models/user';

const GQC = new SchemaComposer();

// create GraphQL Schema with all available resolvers
GQC.rootQuery().addFields({
  //Connections
//   connectionById: ConnectionTC.getResolver('findById'),
//   connectionByIds: ConnectionTC.getResolver('findByIds'),
//   connectionOne: ConnectionTC.getResolver('findOne'),
//   connectionMany: ConnectionTC.getResolver('findMany'),
//   connectionTotal: ConnectionTC.getResolver('count'),
//   connectionConnection: ConnectionTC.getResolver('connection'),
//   connectionPagination: ConnectionTC.getResolver('pagination'),
  
//   //Contacts
//   contactById: ContactTC.getResolver('findById'),
//   contactByIds: ContactTC.getResolver('findByIds'),
//   contactOne: ContactTC.getResolver('findOne'),
//   contactMany: ContactTC.getResolver('findMany'),
//   contactTotal: ContactTC.getResolver('count'),
//   contactConnection: ContactTC.getResolver('connection'),
//   contactPagination: ContactTC.getResolver('pagination'),
  
//   //Content
//   contentById: ContentTC.getResolver('findById'),
//   contentByIds: ContentTC.getResolver('findByIds'),
//   contentOne: ContentTC.getResolver('findOne'),
//   contentMany: ContentTC.getResolver('findMany'),
//   contentTotal: ContentTC.getResolver('count'),
//   contentConnection: ContentTC.getResolver('connection'),
//   contentPagination: ContentTC.getResolver('pagination'),
  
//   //Events
//   eventById: EventTC.getResolver('findById'),
//   eventByIds: EventTC.getResolver('findByIds'),
//   eventOne: EventTC.getResolver('findOne'),
//   eventMany: EventTC.getResolver('findMany'),
//   eventTotal: EventTC.getResolver('count'),
//   eventConnection: EventTC.getResolver('connection'),
//   eventPagination: EventTC.getResolver('pagination'),
  
//   //Locations
//   locationById: LocationTC.getResolver('findById'),
//   locationByIds: LocationTC.getResolver('findByIds'),
//   locationOne: LocationTC.getResolver('findOne'),
//   locationMany: LocationTC.getResolver('findMany'),
//   locationTotal: LocationTC.getResolver('count'),
//   locationConnection: LocationTC.getResolver('connection'),
//   locationPagination: LocationTC.getResolver('pagination'),
  
//   //Providers
//   providerById: ProviderTC.getResolver('findById'),
//   providerByIds: ProviderTC.getResolver('findByIds'),
//   providerOne: ProviderTC.getResolver('findOne'),
//   providerMany: ProviderTC.getResolver('findMany'),
//   providerTotal: ProviderTC.getResolver('count'),
//   providerConnection: ProviderTC.getResolver('connection'),
//   providerPagination: ProviderTC.getResolver('pagination'),
  
//   //Searches
//   searchById: SearchTC.getResolver('findById'),
//   searchByIds: SearchTC.getResolver('findByIds'),
//   searchOne: SearchTC.getResolver('findOne'),
//   searchMany: SearchTC.getResolver('findMany'),
//   searchTotal: SearchTC.getResolver('count'),
//   searchConnection: SearchTC.getResolver('connection'),
//   searchPagination: SearchTC.getResolver('pagination'),

//   //Session
//   sessionById: SessionTC.getResolver('findById'),
//   sessionByIds: SessionTC.getResolver('findByIds'),
//   sessionOne: SessionTC.getResolver('findOne'),
//   sessionMany: SessionTC.getResolver('findMany'),
//   sessionTotal: SessionTC.getResolver('count'),
//   sessionConnection: SessionTC.getResolver('connection'),
//   sessionPagination: SessionTC.getResolver('pagination'),
  
//   //Tags
//   tagById: TagTC.getResolver('findById'),
//   tagByIds: TagTC.getResolver('findByIds'),
//   tagOne: TagTC.getResolver('findOne'),
//   tagMany: TagTC.getResolver('findMany'),
//   tagTotal: TagTC.getResolver('count'),
//   tagConnection: TagTC.getResolver('connection'),
//   tagPagination: TagTC.getResolver('pagination'),
//  // /Things
//   // ngById: ThingTC.getResolver('findById'),
//   // ngByIds: ThingTC.getResolver('findByIds'),
//   // ngOne: ThingTC.getResolver('findOne'),
//   // ngMany: ThingTC.getResolver('findMany'),
//   // ngTotal: ThingTC.getResolver('count'),
//   // ngConnection: ThingTC.getResolver('connection'),
//   // ngPagination: ThingTC.getResolver('pagination'),?
  
  //Users
  userById: UserTC.getResolver('findById'),
  userByIds: UserTC.getResolver('findByIds'),
  userOne: UserTC.getResolver('findOne'),
  userMany: UserTC.getResolver('findMany'), // .debug(), // debug info to console for this resolver
  userTotal: UserTC.getResolver('count'),
  userConnection: UserTC.getResolver('connection'),
  userPagination: UserTC.getResolver('pagination'),
  
});
// For debug purposes you may display resolver internals in the following manner:
// console.log(UserTC.getResolver('findMany').toString());

GQC.rootMutation().addFields({
  
  /*
  // Connections
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  */
  // UsersuserCreate: UserTC.getResolver('createOne'),
  userUpdateById: UserTC.getResolver('updateById'),
  userUpdateOne: UserTC.getResolver('updateOne'),
  userUpdateMany: UserTC.getResolver('updateMany'),
  userRemoveById: UserTC.getResolver('removeById'),
  userRemoveOne: UserTC.getResolver('removeOne'),
  userRemoveMany: UserTC.getResolver('removeMany'),
});

const graphqlSchema = GQC.buildSchema();

export default graphqlSchema;