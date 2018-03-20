/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

import { UserTC } from './user';

export const SessionSchema = new mongoose.Schema(
  {
    
    created: {
      type: Date
    },
    csrf_secret: {
      type: String
    },
    expires: {
      type: Date
    },
    ip: {
      type: String // null
    },
    meta: {
      agent: {
        type: String 
      },
      browser: {
        family: {
          type: String
        },
        version: {
          type: String
        },
      },
      device: {
        family: {
          type: String
        },
        version: {
          type: String
        },
      },
      os: {
        family: {
          type: String
        },
        version: {
          type: String
        },
      },
    },
    
    persist: {
      type: Boolean
    },
    token: {
      type: String
    },
    ttl: {
      type: Date
    },
    user_id: {
      type: Buffer
    }
  },
  {
    collection: 'sessions',
  }
);

export const Session = mongoose.model('Session', SessionSchema);

export const SessionTC = composeWithMongoose(Session);

SessionTC.addFields({
  id: {
    type: 'String', 
    description: 'uuid4 id',
    resolve: (source, args, context, info) => {
      return source._id.toString('hex');
    },
  }
});

SessionTC.addRelation('user', {
  resolver: () => UserTC.getResolver('findById'),
  prepareArgs: {
    filter: source => ({ _id: source.user_id }),
  },
  projection: { user_id: true },
});