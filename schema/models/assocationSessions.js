/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

import { UserTC } from './user';

export const AssociationSessionSchema = new mongoose.Schema(
  {
    connection: {
      type: Buffer
    },
    token: {
      type: Buffer
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