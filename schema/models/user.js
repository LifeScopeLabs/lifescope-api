/* @flow */

import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

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
    meta: {
      type: Object
    },
    _id:{
      type: Buffer,
    },
    name: {
      type: String,
      index: true,
    },
    is_active: {
      type: Boolean,
      index: true,
    },
    joined: {
      type: Date,
      index: false
    },
    last_login: {
      type: Date,
      index: false
    },
    settings: {
      explorer: {
        initial_searches: {
          type: Boolean,
          index: false
        }
      }
    },
    social_accounts: {
      type: Array,
      index: false
    },
    subscriptions: {
      type: Array,
      index: false
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
      enum: ['male', 'female', 'ladyboy', 'ai', 'animal', 'mineral', 'other'],
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

// TODO: Buffer to Base64 encoding fix.

// UserTC.addFields({
//   id: { // extended
//     type: 'String', // String, Int, Float, Boolean, ID, Json, array []
//     description: 'uuid4 id',
//     resolve: (source, args, context, info) => {
//         console.log(source._id.buffer);
//         // console.log(Buffer.from(source._id.buffer, 'base64').toString());
//         // Buffer.from(source._id.buffer, 'base64').toString();
//       },
//     },
// });

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