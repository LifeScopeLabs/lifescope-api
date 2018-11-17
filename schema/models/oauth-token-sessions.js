/* @flow */

import crypto from 'crypto';

import _ from 'lodash';
import { withFilter } from 'graphql-subscriptions';
import {graphql} from 'graphql-compose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid';
import {OAuthAppTC} from "./oauth-apps";


let urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

let validScopes = [
	'basic',
	'events',
	'contacts',
	'content',
	'locations'
];


export const OAuthTokenSessionSchema = new mongoose.Schema(
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

		app_id: {
			type: Buffer
		},

		app_id_string: {
			type: String,
			get: function() {
				return this.app_id.toString('hex')
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.app_id) {
					this._conditions.app_id = uuid(val);

					delete this._conditions.app_id_string;
				}

				this.app_id = uuid(val);
			}
		},

		auth_code: {
			type: String
		},

		created: {
			type: Date,
			expires: 60
		},

		redirect_uri: {
			type: String
		},

		scopes: {
			type: [String]
		},

		state: {
			type: String
		},

		user_id: {
			type: Buffer
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
		}
	},
	{
		collection: 'oauth_token_sessions',
	}
);


export const OAuthTokenSession = mongoose.model('OAuthTokenSession', OAuthTokenSessionSchema);

export const OAuthTokenSessionTC = composeWithMongoose(OAuthTokenSession);