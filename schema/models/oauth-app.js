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
import type from 'type-detect';

import uuid from '../../lib/util/uuid';
import {TagTC} from "./tags";
import {SearchTC} from "./searches";


let urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;


export const OAuthAppSchema = new mongoose.Schema(
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

		client_id: {
			type: String,
			index: false
		},

		client_secret: {
			type: String,
			index: false
		},

		description: {
			type: String,
			index: false
		},

		homepage_url: {
			type: String,
			index: false
		},

		name: {
			type: String,
			index: false
		},

		privacy_policy_url: {
			type: String,
			index: false
		},

		redirect_uris: {
			type: [String],
			index: false,
		},

		user_id: {
			type: Buffer,
			index: false
		},

		user_id_string: {
			type: String,
			get: function() {
				console.log(this);
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
		collection: 'oauth_apps',
	}
);


export const OAuthApp = mongoose.model('OAuthApp', OAuthAppSchema);

export const OAuthAppTC = composeWithMongoose(OAuthApp);


OAuthAppTC.addResolver({
	name: 'initializeOne',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		name: 'String!',
		description: 'String!',
		privacy_policy_url: 'String!',
		homepage_url: 'String!'
	},
	resolve: async function({source, args, context, info}) {
		if (urlRegex.test(args.privacy_policy_url !== true)) {
			return httpErrors(400, 'Invalid privacy policy URL');
		}

		if (urlRegex.test(args.homepage_url) !== true) {
			return httpErrors(400, 'Invalid homepage URL');
		}

		let newApp = {
			id: uuid(),
			client_id: crypto.randomBytes(8).toString('hex'),
			client_secret: crypto.randomBytes(32).toString('hex'),
			redirect_uris: [],
			name: args.name,
			description: args.description,
			privacy_policy_url: args.privacy_policy_url,
			homepage_url: args.homepage_url,
			user_id_string: context.req.user._id.toString('hex')
		};


		let result = await OAuthAppTC.getResolver('createOne').resolve({
			args: {
				record: newApp
			}
		});

		console.log(result.record);
		return result.record;
	}
});


OAuthAppTC.addResolver({
	name: 'patchOne',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		name: 'String',
		description: 'String',
		privacy_policy_url: 'String',
		homepage_url: 'String'
	},
	resolve: async function({source, args, context, info}) {
		if (urlRegex.test(args.privacy_policy_url !== true)) {
			return httpErrors(400, 'Invalid privacy policy URL');
		}

		if (urlRegex.test(args.homepage_url) !== true) {
			return httpErrors(400, 'Invalid homepage URL');
		}

		let update = {
			redirect_uris: [],
			name: args.name,
			description: args.description,
			privacy_policy_url: args.privacy_policy_url,
			homepage_url: args.homepage_url
		};

		let result = await OAuthAppTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: context.req.user._id.toString('hex')
				},
				record: update
			}
		});

		return result.record;
	}
});


OAuthAppTC.addResolver({
	name: 'resetClientSecret',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({source, args, context, info}) {
		let update = {
			client_secret: crypto.randomBytes(32).toString('hex')
		};

		let result = await OAuthAppTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: context.req.user._id.toString('hex')
				},
				record: update
			}
		});

		return result.record;
	}
});


OAuthAppTC.addResolver({
	name: 'deleteOne',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({ source, args, context, info}) {
		await OAuthAppTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});
	}
});