/* @flow */

import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';
import nodeUUID from 'uuid/v4';

import { UserTC } from './users';

import uuid from '../../lib/types/uuid';

export const AssociationSessionSchema = new mongoose.Schema(
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
        console.log('Setting Assoc Session ID');
        if (this._conditions && this._conditions.id) {
          this._conditions._id = uuid(val);
          
          delete this._conditions.id;
        }
        
        this._id = uuid(val);
      }
    },
    connection_id: {
      type: Buffer
    },
    connection_id_string: {
      type: String,
      get: function() {
        if (this.connection_id) {
          return this.connection_id.toString('hex');
        }
      },
      set: function(val) {
        if (this._conditions && this._conditions.connection_id_string) {
          this._conditions.connection_id = uuid(val);
          
          delete this._conditions.connection_id_string;
        }
        
        this.connection_id = uuid(val);
      }
    },
    token: {
      type: Buffer
    },
    token_string: {
      type: String,
      get: function() {
        if (this.token) {
          return this.token.toString('hex');
        }
      },
      set: function(val) {
        if (this._conditions && this._conditions.token_string) {
          this._conditions.token = uuid(val);
          
          delete this._conditions.token_string;
        }
        
        this.token = uuid(val);
      }
    },
    ttl: {
      type: Date
    }
  },
  {
    collection: 'association_sessions',
  }
);

export const AssociationSession = mongoose.model('AssociationSession', AssociationSessionSchema);

export const AssociationSessionTC = composeWithMongoose(AssociationSession);