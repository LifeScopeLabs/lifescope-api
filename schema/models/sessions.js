/* @flow */

import uuid from '../../lib/types/uuid';
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

import nodeUUID from 'uuid/v4';

import { UserTC } from './users';

export const SessionSchema = new mongoose.Schema(
  {
    _id: {
      type: Buffer
    },
    id: {
      type: String,
      get: function() {
        if (this._id) {
          return this._id.toString('hex');
        }
      },
      set: function(val) {
        if (this._conditions && this._conditions.id) {
          this._conditions._id = uuid(val);
          
          delete this._conditions.id;
        }
        
        this._id = uuid(val);
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
      type: String
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
    },
    user_id_string: {
      type: String,
      get: function() {
        return this._id.toString('hex')
      },
      set: function(val) {
        if (val && this._conditions && this._conditions.user_id_string) {
          this._conditions.user_id = uuid(val);
          
          delete this._conditions.user_id_string;
        }
        
        this.user_id = uuid(val);
      }
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
  projection: {
    id: true,
    is_active: true,
    user_id: true 
  },
});