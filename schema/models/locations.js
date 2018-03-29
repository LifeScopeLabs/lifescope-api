/* @flow */

// TODO: FIXXX
// TODO: geolocation type [Double]
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";

export const LocationsSchema = new mongoose.Schema(
	{
		_id: {
			type: Buffer
		},

		id: {
			type: String,
			get: function () {
				if (this._id) {
					return this._id.toString('hex');
				}
			},
			set: function (val) {
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

		connection: {
			type: Buffer,
			index: false
		},

		connection_id_string: {
			type: String,
			get: function () {
				if (this.connection) {
					return this.connection.toString('hex');
				}
			},
			set: function (val) {
				if (this._conditions && this._conditions.connection_id_string) {
					this._conditions.connection = uuid(val);

					delete this._conditions.connection_id_string;
				}

				this.connection = uuid(val);
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

		updated: {
			type: Date,
			index: false
		},

		user_id: {
			type: Buffer,
			index: false
		},

		user_id_string: {
			type: String,
			get: function () {
				return this.user_id.toString('hex')
			},
			set: function (val) {
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

