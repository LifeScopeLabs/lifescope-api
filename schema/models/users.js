/* @flow */

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';
import {graphql} from 'graphql-compose';

import deleteConnection from '../../lib/util/delete-connection';
import uuid from '../../lib/util/uuid';
import { ContactTC } from './contacts';
import { ConnectionTC } from "./connections";
import { ContentTC} from "./content";
import { EventTC } from "./events";
import { LocationTC } from './locations';

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
					if (this._conditions.id.hasOwnProperty('$in')) {
						this._conditions._id = {
							$in: _.map(this._conditions.id.$in, function(item) {
								return uuid(item);
							})
						};
					}
					else {
						this._conditions._id = uuid(val);
					}

					delete this._conditions.id;
				}

				if (val.hasOwnProperty('$in')) {
					this._id = {
						$in: _.map(val.$in, function(item) {
							return uuid(item);
						})
					};

				}
				else {
					this._id = uuid(val);
				}
			}
		},

		api_key: {
			type: Buffer
		},

		api_key_string: {
			type: String,
			get: function() {
				if (this.api_key) {
					return this.api_key.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.api_key_string) {
					if (this._conditions.api_key_string.hasOwnProperty('$in')) {
						this._conditions.api_key = {
							$in: _.map(this._conditions.api_key_string.$in, function(item) {
								return uuid(item);
							})
						};
					}
					else {
						this._conditions.api_key = uuid(val);
					}

					delete this._conditions.api_key_string;
				}

				if (val.hasOwnProperty('$in')) {
					this.api_key = {
						$in: _.map(val.$in, function(item) {
							return uuid(item);
						})
					};

				}
				else {
					this.api_key = uuid(val);
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

		location_tracking_enabled: {
			type: Boolean,
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


// UserTC.addFields({
//   id: {
//     type: 'String', 
//     description: 'uuid4 id',
//     resolve: (source, args, context, info) => {
//       return source._id.toString('hex');
//     },
//   }
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


UserTC.addResolver({
	name: 'deleteAccount',
	kind: 'mutation',
	type: new graphql.GraphQLObjectType({
		name: 'deleteAccount',
		fields: {
			id: 'String'
		}
	}),
	resolve: async ({source, args, context, info}) => {
		let req = context.req;

		let connections = await ConnectionTC.getResolver('findMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		_.each(connections, async function(connection) {
			await deleteConnection(connection._id.toString('hex'), req.user._id.toString('hex'));
		});

		//All Events, Contacts, and Content should be gone after deleteConnection, but try anyway in case there were bugs
		await EventTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await ContactTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await ContentTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await LocationTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await UserTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				}
			}
		});

		context.res.status = 204;
	}
});


UserTC.addResolver({
	name: 'updateApiKey',
	kind: 'mutation',
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({source, args, context, info}) => {
		let req = context.req;

		let updated = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				},
				record: {
					api_key_string: uuid()
				}
			}
		});

		return updated.record;
	}
});


UserTC.addResolver({
	name: 'updateLocationTracking',
	kind: 'mutation',
	args: {
		location_tracking_enabled: 'Boolean!'
	},
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({source, args, context, info}) => {
		let req = context.req;

		let updated = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				},
				record: {
					location_tracking_enabled: args.location_tracking_enabled === true
				}
			}
		});

		return updated.record;
	}
});