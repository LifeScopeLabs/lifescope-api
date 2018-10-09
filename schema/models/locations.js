/* @flow */

// TODO: FIXXX
// TODO: geolocation type [Double]
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";

export const LocationsSchema = new mongoose.Schema(
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

		connection_id: {
			type: Buffer,
			index: false
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

		provider_id: {
			type: Buffer,
			index: false
		},

		provider_id_string: {
			type: String,
			get: function() {
				return this.provider_id.toString('hex')
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.provider_id_string) {
					this._conditions.provider_id = uuid(val);

					delete this._conditions.provider_id_string;
				}

				this.provider_id = uuid(val);
			}
		},

		tracked: Boolean,

		updated: {
			type: Date,
			index: false
		},

		uploaded: Boolean,

		user_id: {
			type: Buffer,
			index: false
		},

		user_id_string: {
			type: String,
			get: function() {
				return this.user_id.toString('hex')
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.user_id_string) {
					this._conditions.user_id = uuid(val);

					delete this._conditions.user_id_string;
				}

				this.user_id = uuid(val);
			}
		},
	},
	{
		collection: 'locations',
	}
);


export const Locations = mongoose.model('Locations', LocationsSchema);

export const LocationTC = composeWithMongoose(Locations);

LocationTC.addResolver({
	name: 'recordOne',
	kind: 'mutation',
	type: LocationTC.getResolver('findOne').getType(),
	args: {
		datetime: 'Date!',
		geo_format: 'String',
		latitude: 'Float',
		longitude: 'Float'
	},
	resolve: async function({source, args, context, info}) {
		if (args.geo_format !== 'lat_lng') {
			throw new httpErrors(400, 'Accepted geo_format types are: \'lat_lng\'');
		}

		let document = {
			id: uuid(),
			created: moment().utc().toDate(),
			identifier: 'user-tracked:::browser:::' + args.datetime,
			estimated: false,
			datetime: moment(args.datetime).utc().toDate(),
			geo_format: args.geo_format,
			geolocation: [
				args.longitude,
				args.latitude
			],
			tracked: true,
			updated: moment().utc().toDate(),
			user_id_string: context.req.user._id.toString('hex')
		};

		let result = await LocationTC.getResolver('createOne').resolve({
			args: {
				record: document
			}
		});

		return result.record;
	}
});

LocationTC.addResolver({
	name: 'deleteTrackedLocations',
	kind: 'mutation',
	type: LocationTC.getResolver('findOne').getType(),
	resolve: async function({source, args, context, info}) {
		let terms = {
			user_id_string: context.req.user._id.toString('hex'),
			tracked: true
		};

		return await LocationTC.getResolver('removeMany').resolve({
			args: {
				filter: terms
			}
		});
	}
});

LocationTC.addResolver({
	name: 'deleteUploadedLocations',
	kind: 'mutation',
	type: LocationTC.getResolver('findOne').getType(),
	resolve: async function({source, args, context, info}) {
		let terms = {
			user_id_string: context.req.user._id.toString('hex'),
			uploaded: true
		};

		return await LocationTC.getResolver('removeMany').resolve({
			args: {
				filter: terms
			}
		});
	}
});

