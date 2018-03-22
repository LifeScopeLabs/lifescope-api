/* @flow */

// TODO: FIXXX
// TODO: geolocation type [Double]
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const LocationsSchema = new mongoose.Schema(
  {
    connection: {
      type: Buffer,
      index: false
    },
    created: {
      type: Date,
      index: false
    },
    datetime: {
      type: Date,
      index: false
    },
    
    estimated: {
      type: Boolean,
      index: false
    },
    
    geo_format: {
      type: String,
      index: false
    },
    geolocation: {
      type: [Number],
      index: false
    },
    identifier: {
      type: String,
      index: false
    },
    updated: {
      type: Date,
      index: false
    },
    
    user_id: {
      type: Buffer,
      index: false
    },
  },
  {
    collection: 'locations',
  }
);
  
  
export const Locations = mongoose.model('Locations', LocationsSchema);

export const LocationTC = composeWithMongoose(Locations);

