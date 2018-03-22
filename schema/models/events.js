/* @flow */

// TODO: FIXXX
// TODO: change source type
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const EventsSchema = new mongoose.Schema(
  {
    connection: {
      type: Buffer,
      index: false
    },
    
    contact_interaction_type: {
      type: String,
      index: false
    },
    
    contacts: {
      type: [Buffer],
      index: false
    },
    content: {
      type: [Buffer],
      index: false
    },
    context: {
      type: String,
      index: false
    },
    created: {
      type: Date,
      index: false
    },
    datetime: {
      type: Date,
      index: false
    },
    identifier: {
      type: String,
      index: false
    },
    provider: {
      type: String,
      index: false
    },
    provider_name: {
      type: String,
      index: false
    },
    source: {
      type: String,
      index: false
    },
    type: {
      type: String,
      index: false
    },
    
    updated: {
      type: Date,
      index: false
    },
    user_id: {
      type: Buffer,
      index: false
    },
  },
  {
    collection: 'events',
  }
);
  

  
export const Events = mongoose.model('Events', EventsSchema);

export const EventTC = composeWithMongoose(Events);

