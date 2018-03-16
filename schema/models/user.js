/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose';

const AccountTypeSchema = new mongoose.Schema(
  {
    language: String,
    skill: {
      type: String,
      enum: ['free', 'plus', 'pro'],
    },
  },
  {
    _id: false,
  }
);

const AddressSchema = new mongoose.Schema({
  street: String,
  geo: {
    type: [Number], // [<longitude>, <latitude>]
    index: '2dsphere', // create the geospatial index
  },
});

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
    },
    is_active: {
      type: Boolean,
      index: true,
    },
    age: {
      type: Number,
      index: true,
    },
    accountType: {
      type: [AccountTypeSchema],
      default: [],
    }, 
    contacts: {
      // another mongoose way for providing embedded documents
      email: String,
      phones: [String], // array of strings
    },
    gender: {
      // enum field with values
      type: String,
      enum: ['male', 'female', 'ladyboy'],
    },
    address: {
      type: AddressSchema,
    },
    otherData: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Some dynamic data',
    },
  },
  {
    collection: 'users',
  }
);

UserSchema.index({ gender: 1, age: -1 });

export const User = mongoose.model('User', UserSchema);

export const UserTC = composeWithMongoose(User);

UserTC.setResolver(
  'findMany',
  UserTC.getResolver('findMany').addFilterArg({
    name: 'geoDistance',
    type: `input GeoDistance {
      lng: Float!
      lat: Float!
      # Distance in meters
      distance: Float!
    }`,
    description: 'Search by distance in meters',
    query: (rawQuery, value, resolveParams) => { // eslint-disable-line
      if (!value.lng || !value.lat || !value.distance) return;
      // read more https://docs.mongodb.com/manual/tutorial/query-a-2dsphere-index/
      rawQuery['address.geo'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [value.lng, value.lat],
          },
          $maxDistance: value.distance, // <distance in meters>
        },
      };
    },
  })
  // /* FOR DEBUG */
  //   .debug()
  // /* OR MORE PRECISELY */
  //   .debugParams()
  //   .debugPayload()
  //   .debugExecTime()
);