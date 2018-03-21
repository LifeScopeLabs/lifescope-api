/* @flow */

import { SchemaComposer, TypeMapper } from 'graphql-compose';

import uuid from './types/uuid';
// import { ConnectionTC } from './models/connections';
// import { ContactTC } from './models/contacts';
// import { ContentTC } from './models/content';
// import { EventTC } from './models/events';
// import { LocationTC } from './models/locations';
// import { ProviderTC } from './models/providers';
// import { SearchTC } from './models/searches';
import { SessionTC } from './models/session';
// import { TagTC } from './models/tags';
// import { ThingTC } from './models/things';

import { UserTC } from './models/user';

const GQC = new SchemaComposer();

TypeMapper.set('UUID', uuid);
console.log(TypeMapper);
console.log(TypeMapper.get('UUID'));
// const typeComposer = new TypeComposer();

// console.log(typeComposer);

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
  sessionMany: SessionTC.getResolver('findMany'),
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
  connectionCreate: ConnectionTC.getResolver('createOne'),
  connectionUpdateById: ConnectionTC.getResolver('updateById'),
  connectionUpdateOne: ConnectionTC.getResolver('updateOne'),
  connectionUpdateMany: ConnectionTC.getResolver('updateMany'),
  connectionRemoveById: ConnectionTC.getResolver('removeById'),
  connectionRemoveOne: ConnectionTC.getResolver('removeOne'),
  connectionRemoveMany: ConnectionTC.getResolver('removeMany'),
  
  // Contacts
  contactCreate: ContactTC.getResolver('createOne'),
  contactUpdateById: ContactTC.getResolver('updateById'),
  contactUpdateOne: ContactTC.getResolver('updateOne'),
  contactUpdateMany: ContactTC.getResolver('updateMany'),
  contactRemoveById: ContactTC.getResolver('removeById'),
  contactRemoveOne: ContactTC.getResolver('removeOne'),
  contactRemoveMany: ContactTC.getResolver('removeMany'),
  
  // Content
  contentCreate: ContentTC.getResolver('createOne'),
  contentUpdateById: ContentTC.getResolver('updateById'),
  contentUpdateOne: ContentTC.getResolver('updateOne'),
  contentUpdateMany: ContentTC.getResolver('updateMany'),
  contentRemoveById: ContentTC.getResolver('removeById'),
  contentRemoveOne: ContentTC.getResolver('removeOne'),
  contentRemoveMany: ContentTC.getResolver('removeMany'),
  
  // Events
  eventCreate: EventTC.getResolver('createOne'),
  eventUpdateById: EventTC.getResolver('updateById'),
  eventUpdateOne: EventTC.getResolver('updateOne'),
  eventUpdateMany: EventTC.getResolver('updateMany'),
  eventRemoveById: EventTC.getResolver('removeById'),
  eventRemoveOne: EventTC.getResolver('removeOne'),
  eventRemoveMany: EventTC.getResolver('removeMany'),
  
  // Locations
  locationCreate: LocationTC.getResolver('createOne'),
  locationUpdateById: LocationTC.getResolver('updateById'),
  locationUpdateOne: LocationTC.getResolver('updateOne'),
  locationUpdateMany: LocationTC.getResolver('updateMany'),
  locationRemoveById: LocationTC.getResolver('removeById'),
  locationRemoveOne: LocationTC.getResolver('removeOne'),
  locationRemoveMany: LocationTC.getResolver('removeMany'),
  
  // Providers
  providerCreate: ProviderTC.getResolver('createOne'),
  providerUpdateById: ProviderTC.getResolver('updateById'),
  providerUpdateOne: ProviderTC.getResolver('updateOne'),
  providerUpdateMany: ProviderTC.getResolver('updateMany'),
  providerRemoveById: ProviderTC.getResolver('removeById'),
  providerRemoveOne: ProviderTC.getResolver('removeOne'),
  providerRemoveMany: ProviderTC.getResolver('removeMany'),
  
  // Searches
  searchCreate: SearchTC.getResolver('createOne'),
  searchUpdateById: SearchTC.getResolver('updateById'),
  searchUpdateOne: SearchTC.getResolver('updateOne'),
  searchUpdateMany: SearchTC.getResolver('updateMany'),
  searchRemoveById: SearchTC.getResolver('removeById'),
  searchRemoveOne: SearchTC.getResolver('removeOne'),
  searchRemoveMany: SearchTC.getResolver('removeMany'),
  
  // Session
  sessionCreate: SessionTC.getResolver('createOne'),
  sessionUpdateById: SessionTC.getResolver('updateById'),
  sessionUpdateOne: SessionTC.getResolver('updateOne'),
  sessionUpdateMany: SessionTC.getResolver('updateMany'),
  sessionRemoveById: SessionTC.getResolver('removeById'),
  sessionRemoveOne: SessionTC.getResolver('removeOne'),
  sessionRemoveMany: SessionTC.getResolver('removeMany'),
  
  // Tags
  tagCreate: TagTC.getResolver('createOne'),
  tagUpdateById: TagTC.getResolver('updateById'),
  tagUpdateOne: TagTC.getResolver('updateOne'),
  tagUpdateMany: TagTC.getResolver('updateMany'),
  tagRemoveById: TagTC.getResolver('removeById'),
  tagRemoveOne: TagTC.getResolver('removeOne'),
  tagRemoveMany: TagTC.getResolver('removeMany'),
  
  // Things
  thingCreate: ThingTC.getResolver('createOne'),
  thingUpdateById: ThingTC.getResolver('updateById'),
  thingUpdateOne: ThingTC.getResolver('updateOne'),
  thingUpdateMany: ThingTC.getResolver('updateMany'),
  thingRemoveById: ThingTC.getResolver('removeById'),
  thingRemoveOne: ThingTC.getResolver('removeOne'),
  thingRemoveMany: ThingTC.getResolver('removeMany'),
  
  // template
  Create: TC.getResolver('createOne'),
  UpdateById: TC.getResolver('updateById'),
  UpdateOne: TC.getResolver('updateOne'),
  UpdateMany: TC.getResolver('updateMany'),
  RemoveById: TC.getResolver('removeById'),
  RemoveOne: TC.getResolver('removeOne'),
  RemoveMany: TC.getResolver('removeMany'),
  */
  // Users
  userCreate: UserTC.getResolver('createOne'),
  userUpdateOne: UserTC.getResolver('updateOne'),
  userUpdateMany: UserTC.getResolver('updateMany'),
  userRemoveOne: UserTC.getResolver('removeOne'),
  userRemoveMany: UserTC.getResolver('removeMany'),
});

const graphqlSchema = GQC.buildSchema();

export default graphqlSchema;