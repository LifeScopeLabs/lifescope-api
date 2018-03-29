/* @flow */

// TODO: FIXXX
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid';

export const ProvidersSchema = new mongoose.Schema(
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

		sources: {
			type: Object
		},

		remote_map_id: {
			type: Buffer
		},

		remote_map_id_string: {
			type: String,
			get: function () {
				if (this.remote_map_id) {
					return this.remote_map_id.toString('hex');
				}
			},
			set: function (val) {
				if (this._conditions && this._conditions.remote_map_id_string) {
					this._conditions.remote_map_id = uuid(val);

					delete this._conditions.remote_map_id_string;
				}

				this.remote_map_id = uuid(val);
			}
		}
	},
	{
		collection: 'providers',
	}
);

export const Providers = mongoose.model('Providers', ProvidersSchema);

export const ProviderTC = composeWithMongoose(Providers);

