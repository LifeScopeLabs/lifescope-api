/* @flow */

import _ from 'lodash';
import graphqlComposeMongoose from 'graphql-compose-mongoose';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid.js';

const { composeWithMongoose } = graphqlComposeMongoose;


export const LoginSessionSchema = new mongoose.Schema(
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

		email: {
			type: String
		},

		newsletter: {
			type: Boolean
		},

		token: {
			type: Buffer
		},

		token_string: {
			type: String,
			get: function() {
				if (this.token) {
					return this.token.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.token_string) {
					this._conditions.token = uuid(val);

					delete this._conditions.token_string;
				}

				this.token = uuid(val);
			}
		},
		
		type: {
			type: String
		},

		ttl: {
			type: Date
		},

		user_id: {
			type: Buffer,
			index: false
		},

		user_id_string: {
			type: String,
			get: function() {
				return this.user_id.toString('hex');
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.user_id_string) {
					this._conditions.user_id = uuid(val);

					delete this._conditions.user_id_string;
				}

				this.user_id = uuid(val);
			}
		}
	},
	{
		collection: 'login_sessions',
	}
);

export const LoginSession = mongoose.model('LoginSession', LoginSessionSchema);

export const LoginSessionTC = composeWithMongoose(LoginSession);