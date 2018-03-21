/* @flow */

import bson from 'bson';
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import uuidParse from 'uuid-parse';

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
      type: Buffer
    },
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
//     toObject: {
//       getters: true,
//       transform: function (doc, ret) {
//         console.log('Transforming UUID to buffer');
//         ret._id = Buffer.from(ret._id, 'hex');

//         return ret;
//      }
//     },
//     toJSON: {
//       getters: true,
//       transform: function (doc, ret) {
//         console.log('Transforming UUID to string');
//         ret._id = ret._id.toString('hex');

//         return ret;
//       }
//     }
  }
);

// UserSchema.virtual('_id')
//   .set(function (uuid4ID) {
//     this._id = Buffer.from(uuid4ID, 'hex')[0];;
//   })
//   .get(function () {
//     return this._id.toString('hex');
//   });

UserSchema.index({ gender: 1, age: -1 });

export const User = mongoose.model('User', UserSchema);

export const UserTC = composeWithMongoose(User);

// UserTC.addFields({
//   _id: { // extended
//     type: 'String', // String, Int, Float, Boolean, ID, Json, array []
//     description: 'uuid4 id',
//     resolve: (source, args, context, info) => {
//       return source._id.toString('hex');
//     },
//   }
// });


UserTC.addFields({
  id: {
    type: 'String', 
    description: 'uuid4 id',
    resolve: (source, args, context, info) => {
      return source._id.toString('hex');
    },
  }
});

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