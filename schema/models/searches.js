/* @flow */

// TODO: FIXXX
// TODO: rename relative-number and since-exactly to get rid of -
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";

export const SearchesSchema = new mongoose.Schema(
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

		count: {
			type: Number,
			index: false
		},

		favorited: {
			type: Boolean,
			index: false
		},

		filters: {
			data: {
				connection: {
					type: String,
					index: false
				},
				contact: {
					type: String,
					index: false
				},
				from: {
					type: String,
					index: false
				},
				interaction: {
					type: String,
					index: false
				},
				provider: {
					type: String,
					index: false
				},
				'relative-number': {
					type: String,
					index: false
				},
				'since-exactly': {
					type: String,
					index: false
				},
				to: {
					type: String,
					index: false
				},
				type: {
					type: String,
					index: false
				},
				units: {
					type: String,
					index: false
				},
			},
			name: {
				type: String,
				index: false
			},
			type: {
				type: String,
				index: false
			},
		},

		hash: {
			type: String,
			index: false
		},

		icon: {
			type: String,
			index: false
		},

		icon_color: {
			type: String,
			index: false
		},

		last_run: {
			type: Date,
			index: false
		},

		name: {
			type: String,
			index: false
		},

		query: {
			type: String,
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
		collection: 'searches',
	}
);

export const Searches = mongoose.model('Searches', SearchesSchema);

export const SearchTC = composeWithMongoose(Searches);