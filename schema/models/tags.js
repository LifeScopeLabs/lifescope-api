/* @flow */

// TODO: FIXXX
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const TagsSchema = new mongoose.Schema(
  {
    created: {
      type: Date
    },
    tag: {
      type: String
    },
    updated: {
      type: Date
    },
    user_id: {
      type: Buffer
    },
  },
  {
    collection: 'tags',
  }
);
  
export const Tags = mongoose.model('Tags', TagsSchema);

export const TagTC = composeWithMongoose(Tags);