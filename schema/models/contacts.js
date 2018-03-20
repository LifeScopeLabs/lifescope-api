/* @flow */

// TODO: FIXXX
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const ContactsSchema = new mongoose.Schema(
  {
    avatar_url: {
      type: String,
      index: false
    },
    
    connection: {
      type: Buffer,
      index: false
    },
    
    created: {
      type: Date,
      index: false
    },
    
    handle: {
      type: String,
      index: false
    },
    
    identifier: {
      type: String,
      index: false
    },
    
    name: {
      type: String,
      index: false
    },
    
    provider_name: {
      type: String,
      index: false
    },
    
    remote_id: {
      type: String,
      index: false
    },
    
    tagMasks: {
      added: {
        type: [String],
        index: false
      },
    },
    
    updated: {
      type: Date,
      index: false
    },
    
    user_id: {
      type: Buffer,
      //index: false
    },
  },
  {
    collection: 'contacts',
  }
);
  

export const Contacts = mongoose.model('Contacts', ContactsSchema);

export const ContactTC = composeWithMongoose(Contacts);

