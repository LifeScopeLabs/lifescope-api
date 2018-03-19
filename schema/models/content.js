/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const ContentSchema = new mongoose.Schema(
  {
    connection: {
      type: Buffer,
      index: false
    },
    created: {
      type: Date,
      index: false
    },
    embed_content: {
      type: String,
      index: false
    },
    embed_format: {
      type: String,
      index: false
    },
    embed_thumbnail: {
      type: String,
      index: false
    },
    embeded_format: {
      type: String,
      index: false
    },
    identifier: {
      type: String,
      index: false
    },
    
    mimetype: {
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
      source: {
        type: [String],
        index: false
      }
    },
    
    text: {
      type: String,
      index: false
    },
    
    thumbnail: {
      type: String,
      index: false
    },
    
    title: {
      type: String,
      index: false
    },
    
    
    type: { // name clash?
      type: undefined, // String
      index: false
    },
    
    updated: {
      type: Date,
      index: false
    },
    
    url: {
      type: String,
      index: false
    },
    
    user_id: {
      type: Buffer,
      index: false
    },
  }
);
  