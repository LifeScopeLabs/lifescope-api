/* @flow */

import bson from 'bson';
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import uuidParse from 'uuid-parse';

import { UserTC } from './user';

export const SessionSchema = new mongoose.Schema(
  {
    _id: Buffer,
    id: {
      type: String,
      get: function() {
        return this._id.toString('hex')
      },
      set: function(val) {
        if (this._conditions && this._conditions.id) {
          var uuidBuffer = new mongoose.Types.Buffer(uuidParse.parse(val));
          uuidBuffer.subtype(bson.Binary.SUBTYPE_UUID);
          this._conditions._id = uuidBuffer.toObject();
          
          delete this._conditions.id;
        }
      }
    },
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

SessionTC.addRelation('user', {
  resolver: () => UserTC.getResolver('findOne'),
  prepareArgs: {
    filter: source => ({ id: source.user_id.toString('hex') }),
  },
  projection: { user_id: true },
});