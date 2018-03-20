/* @flow */

// TODO: FIXXX
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const ThingsSchema = new mongoose.Schema(
  {
  },
  {
    collection: 'things',
  }
);
  
export const Things = mongoose.model('Things', ThingsSchema);

export const ThingTC = composeWithMongoose(Things);