/* @flow */

// TODO: FIXXX
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";

export const TagsSchema = new mongoose.Schema(
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

		created: {
			type: Date
		},

		tag: {
			type: String
		},

		updated: {
			type: Date
		},

		user_id: {
			type: Buffer
		},

		user_id_string: {
			type: String,
			get: function () {
				return this._id.toString('hex')
			},
			set: function (val) {
				if (val && this._conditions && this._conditions.user_id_string) {
					this._conditions.user_id = uuid(val);

					delete this._conditions.user_id_string;
				}

				this.user_id = uuid(val);
			}
		}
	},
	{
		collection: 'tags',
	}
);

export const Tags = mongoose.model('Tags', TagsSchema);

export const TagTC = composeWithMongoose(Tags);