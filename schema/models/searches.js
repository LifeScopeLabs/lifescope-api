/* @flow */

// TODO: FIXXX
// TODO: rename relative-number and since-exactly to get rid of -
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const SearchesSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      index: false
    },
    favorited: {
      type: Boolean,
      index: false
    },
    filters: {
      data: {
        connection: {
          type: String,
          index: false
        },
        contact: {
          type: String,
          index: false
        },
        from: {
          type: String,
          index: false
        },
        interaction: {
          type: String,
          index: false
        },
        provider: {
          type: String,
          index: false
        },
        'relative-number': {
          type: String,
          index: false
        },
        'since-exactly': {
          type: String,
          index: false
        },
        to: {
          type: String,
          index: false
        },
        type: {
          type: String,
          index: false
        },
        units: {
          type: String,
          index: false
        },
      },
      name: {
        type: String,
        index: false
      },
      type: {
        type: String,
        index: false
      },
    },
    hash: {
      type: String,
      index: false
    },
    icon: {
      type: String,
      index: false
    },
    icon_color: {
      type: String,
      index: false
    },
    last_run: {
      type: Date,
      index: false
    },
    name: {
      type: String,
      index: false
    },
    query: {
      type: String,
      index: false
    },
    user_id: {
      type: Buffer,
      index: false
    },
      
  },
  {
    collection: 'searches',
  }
);
  
export const Searches = mongoose.model('Searches', SearchesSchema);

export const SearchTC = composeWithMongoose(Searches);