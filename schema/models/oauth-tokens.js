/* @flow */

import crypto from 'crypto';

import _ from 'lodash';
import { graphql } from 'graphql-compose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid';
import { ConnectionTC } from './connections';
import { OAuthAppTC } from "./oauth-apps";
import { OAuthTokenSessionTC } from "./oauth-token-sessions";


let validScopes = [
	'basic',
	'events:read',
	'events:write',
	'contacts:read',
	'contacts:write',
	'content:read',
	'content:write',
	'locations:read',
	'locations:write',
	'people:read',
	'people:write',
];

let authorizationType = new graphql.GraphQLObjectType({
	name: 'authorization',
	fields: {
		code: {
			type: graphql.GraphQLString
		},
		state: {
			type: graphql.GraphQLString
		},
		access_token: {
			type: graphql.GraphQLString,
		},
		expires_in: {
			type: graphql.GraphQLString
		}
	}
});

let tokenType = new graphql.GraphQLObjectType({
	name: 'token',
	fields: {
		access_token: {
			type: graphql.GraphQLString
		},
		refresh_token: {
			type: graphql.GraphQLString
		},
		expires_in: {
			type: graphql.GraphQLString
		},
		connection_id_string: {
			type: graphql.GraphQLString
		}
	}
});


export const OAuthTokenSchema = new mongoose.Schema(
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

		access_token: {
			type: String
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
				if (val && this._conditions && this._conditions.app_id_string) {
					this._conditions.app_id = uuid(val);

					delete this._conditions.app_id_string;
				}

				this.app_id = uuid(val);
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

		expires: Date,

		refresh_token: {
			type: String
		},

		scopes: {
			type: [String]
		},

		valid: Boolean,

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
		collection: 'oauth_tokens',
	}
);


export const OAuthToken = mongoose.model('OAuthToken', OAuthTokenSchema);

export const OAuthTokenTC = composeWithMongoose(OAuthToken);


OAuthTokenTC.addResolver({
	name: 'authorization',
	kind: 'mutation',
	type: authorizationType,
	args: {
		response_type: 'String!',
		client_id: 'String!',
		redirect_uri: 'String!',
		scope: 'String',
		state: 'String'
	},
	resolve: async function({args, context}) {
		let scopes;
		let errors = [];

		if (args.response_type !== 'code') {
			errors.push('response_type must be \'code\'');
		}

		if (args.scope) {
			scopes = args.scope.split(',');

			let scopeErrorMessage = 'Invalid scopes: ';
			let scopeErrors = [];

			_.each(scopes, function(scope, index) {
				let lowercase = scope.toLowerCase();

				if (validScopes.indexOf(lowercase) < 0) {
					scopeErrors.push(lowercase);
				}

				scopes[index] = lowercase;
			});

			if (scopeErrors.length > 0) {
				errors.push(scopeErrorMessage.concat(scopeErrors.join(', ')));
			}
		}
		else {
			errors.push('Must request at least one scope.');
		}

		let app = await OAuthAppTC.getResolver('findOne').resolve({
			args: {
				filter: {
					client_id: args.client_id
				}
			}
		});

		if (app == null) {
			errors.push('Invalid client_id');
		}

		if (app != null) {
			if (app.redirect_uris.indexOf(args.redirect_uri) < 0) {
				errors.push('Invalid redirect_uri');
			}
		}

		if (errors.length > 0) {
			return httpErrors(400, 'There were problems with your request -- ' + errors.join('; '));
		}
		else {
			await OAuthTokenSessionTC.getResolver('removeMany').resolve({
				args: {
					filter: {
						user_id_string: context.req.user._id.toString('hex')
					}
				}
			});

			let newSession = {
				id: uuid(),
				auth_code: crypto.randomBytes(16).toString('hex'),
				created: moment().utc().toDate(),
				client_id: args.client_id,
				redirect_uri: args.redirect_uri,
				scopes: scopes,
				user_id_string: context.req.user._id.toString('hex')
			};

			await OAuthTokenSessionTC.getResolver('createOne').resolve({
				args: {
					record: newSession
				}
			});

			return {
				code: newSession.auth_code,
				state: args.state
			};
		}
	}
});


OAuthTokenTC.addResolver({
	name: 'token',
	kind: 'mutation',
	type: tokenType,
	args: {
		grant_type: 'String!',
		code: 'String',
		redirect_uri: 'String',
		client_id: 'String!',
		client_secret: 'String!',
		refresh_token: 'String'
	},
	resolve: async function({args}) {
		let errors = [];

		if (args.grant_type !== 'authorization_code' && args.grant_type !== 'refresh_token') {
			errors.push('grant_type must be \'authorization_code\' or \'refresh_token\'.');
		}

		let app = await OAuthAppTC.getResolver('findOne').resolve({
			args: {
				filter: {
					client_id: args.client_id,
					client_secret: args.client_secret
				}
			}
		});

		if (app == null) {
			errors.push('client_id and/or client_secret are invalid');
		}

		if (args.grant_type === 'authorization_code') {
			let session = await OAuthTokenSessionTC.getResolver('findOne').resolve({
				args: {
					filter: {
						auth_code: args.code
					}
				}
			});

			if (session == null) {
				errors.push('Invalid code or code has expired');
			}

			if (session && session.redirect_uri !== args.redirect_uri) {
				errors.push('Invalid redirect_uri');
			}

			if (session) {
				await OAuthTokenSessionTC.getResolver('removeOne').resolve({
					args: {
						filter: {
							id: session._id.toString('hex')
						}
					}
				});
			}

			if (errors.length > 0) {
				return httpErrors(400, 'There were problems with your request -- ' + errors.join('; '));
			}
			else {
				let dateNow = moment();
				let expires = moment().utc().add(1, 'month');

				let newToken = {
					id: uuid(),
					access_token: crypto.randomBytes(32).toString('hex'),
					app_id_string: app._id.toString('hex'),
					expires: expires.toDate(),
					refresh_token: crypto.randomBytes(32).toString('hex'),
					scopes: session.scopes,
					user_id_string: session.user_id.toString('hex'),
					valid: true,
				};

				let connection = await ConnectionTC.getResolver('findOne').resolve({
					args: {
						filter: {
							provider_id_string: app.provider_id.toString('hex'),
							user_id_string: session.user_id.toString('hex')
						}
					}
				});

				if (connection == null) {
					let newConnection = {
						id: uuid(),
						enabled: true,
						auth: {
							status: {
								complete: true,
								authorized: true
							}
						},
						oauth_app_name: app.name,
						provider_name: app.name,
						provider_id_string: app.provider_id.toString('hex'),
						runnable: false,
						user_id_string: session.user_id.toString('hex')
					};

					let connectionResult = await ConnectionTC.getResolver('createOne').resolve({
						args: {
							record: newConnection
						}
					});

					connection = connectionResult.record;
				}

				newToken.connection_id_string = connection._id.toString('hex');

				await OAuthTokenTC.getResolver('createOne').resolve({
					args: {
						record: newToken
					}
				});

				return {
					access_token: newToken.access_token,
					refresh_token: newToken.refresh_token,
					expires_in: expires.diff(dateNow, 'seconds'),
					connection_id_string: connection._id.toString('hex')
				};
			}
		}
		else {
			let token = await OAuthTokenTC.getResolver('findOne').resolve({
				args: {
					filter: {
						app_id_string: app._id.toString('hex'),
						refresh_token: args.refresh_token
					}
				}
			});

			let connection = await ConnectionTC.getResolver('findOne').resolve({
				args: {
					filter: {
						provider_id_string: app.client_id.toString('hex'),
						user_id_string: token.user_id.toString('hex')
					}
				}
			});

			if (connection == null) {
				let newConnection = {
					id: uuid(),
					enabled: true,
					auth: {
						status: {
							complete: true,
							authorized: true
						}
					},
					oauth_app_name: app.name,
					provider_name: app.name,
					provider_id_string: app.client_id.toString('hex'),
					runnable: false,
					user_id_string: token.user_id.toString('hex')
				};

				connection = await ConnectionTC.getResolver('createOne').resolve({
					args: {
						record: newConnection
					}
				});
			}

			if (token == null) {
				return httpErrors(400, 'Invalid refresh token and/or client_id.')
			}
			else {
				let dateNow = moment();
				let expires = moment().utc().add(1, 'month');
				let newToken = crypto.randomBytes(32).toString('hex');

				await OAuthTokenTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							id: token._id.toString('hex')
						},
						record: {
							access_token: newToken,
							expires: expires
						}
					}
				});

				return {
					access_token: newToken,
					expires_in: expires.diff(dateNow, 'seconds'),
					connection_id_string: connection._id.toString('hex')
				}
			}
		}
	}
});