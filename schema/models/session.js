/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

import { UserTC } from './user';

export const SessionSchema = new mongoose.Schema(
  {
    meta: {
      type: Object
    },
    token: {
      type: String
    },
    csrf_secret: {
      type: String
    },
    created: {
      type: Date
    },
    expires: {
      type: Date
    },
    persist: {
      type: Boolean
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

SessionTC.addRelation('user', {
  resolver: () => UserTC.getResolver('findById'),
  prepareArgs: {
    filter: source => ({ _id: source.user_id }),
  },
  projection: { user_id: true },
});