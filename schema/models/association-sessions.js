/* @flow */

import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid';

export const AssociationSessionSchema = new mongoose.Schema(
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

		app_session_token: {
			type: String
		},

		connection_id: {
			type: Buffer
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

		ttl: {
			type: Date
		}
	},
	{
		collection: 'association_sessions',
	}
);

export const AssociationSession = mongoose.model('AssociationSession', AssociationSessionSchema);

export const AssociationSessionTC = composeWithMongoose(AssociationSession);