/* global env */

import _ from 'lodash';
import { graphql } from 'graphql-compose';
import GraphQLJSON from 'graphql-type-json';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';
import type from 'type-detect';

import deleteConnection from '../../lib/util/delete-connection';
import { AssociationSessionTC } from './association-sessions';
import { ProviderTC } from './providers';
import { Create as CreateSession } from '../../lib/sessions';

import uuid from '../../lib/util/uuid';


let eliminateType = new graphql.GraphQLObjectType({
	name: 'eliminateConnection',
	fields: {
		id: {
			type: graphql.GraphQLString
		}
	}
});

let initializeType = new graphql.GraphQLObjectType({
	name: 'initializeConnection',
	fields: {
		id: {
			type: graphql.GraphQLString
		},
		redirectUrl: {
			type: graphql.GraphQLString
		}
	}
});

let patchType = new graphql.GraphQLObjectType({
	name: 'patchConnection',
	fields: {
		connection: {
			type: GraphQLJSON
		},
		reauthorize: {
			type: graphql.GraphQLBoolean
		}
	}
});

const extensionProviderMap = {
	Chrome: 'bff10113c2c4437391c1dfc8699d024f',
	Firefox: '0f9b3f89b5bf411185a73016933c34df'
};

const financialProviderId = 'd2b24c35ffbb47d694ec7a2951247c88';


export const ConnectionsSchema = new mongoose.Schema(
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

		auth: {
			status: {
				authorized: {
					type: Boolean,
					index: false
				},
				complete: {
					type: Boolean,
					index: false
				}
			},
			redirectUrl: {
				type: String,
				index: false
			}
		},

		browser: {
			type: String
		},

		enabled: {
			type: Boolean,
			index: false
		},

		endpoint_data: {
			type: mongoose.Schema.Types.Mixed
		},

		frequency: {
			type: Number,
			index: false
		},

		last_run: {
			type: Date
		},

		last_successful_run: {
			type: Date
		},

		name: {
			type: String,
			get: async function() {
				let bitscoop = env.bitscoop;

				if (this.remote_connection_id) {
					try {
						let bitscoopConnection = await bitscoop.getConnection(this.remote_connection_id.toString('hex'));

						return bitscoopConnection.name;
					}
					catch (err) {
						console.log('Could not get connection for ' + this._id.toString('hex')); //eslint-disable-line no-console

						return 'Bad Connection';
					}

				}
				else if (this.browser != null) {
					return this.browser + ' Extension';
				}
				else if (this.provider_id.toString('hex') === financialProviderId) {
					return 'Financial Files';
				}
				else if (this.oauth_app_name != null) {
					return this.oauth_app_name;
				}
			}
		},

		oauth_app_name: {
			type: String
		},

		permissions: {
			type: mongoose.Schema.Types.Mixed
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

		provider_name: {
			type: String,
			index: false
		},

		remote_connection_id: {
			type: Buffer,
			index: false
		},

		remote_connection_id_string: {
			type: String,
			get: function() {
				return this.remote_connection_id.toString('hex')
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.remote_connection_id_string) {
					this._conditions.remote_connection_id = uuid(val);

					delete this._conditions.remote_connection_id_string;
				}

				this.remote_connection_id = uuid(val);
			}
		},

		runnable: Boolean,

		status: {
			type: String,
			index: false
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
		collection: 'connections',
	}
);


export const Connection = mongoose.model('Connections', ConnectionsSchema);

export const ConnectionTC = composeWithMongoose(Connection);


ConnectionTC.addRelation('provider', {
	resolver: () => ProviderTC.getResolver('providerWithMapOne'),
	prepareArgs: {
		filter: function(source) {
			return {
				id: source.provider_id.toString('hex')
			}
		},
	}
});

ConnectionTC.addResolver({
	name: 'initializeConnection',
	kind: 'mutation',
	type: initializeType,
	args: {
		provider_id_string: 'String!',
		name: 'String',
		permissions: 'JSON',
		app_session: 'Boolean',
	},
	resolve: async function({args, context}) {
		let appSession;
		let bitscoop = env.bitscoop;

		await env.validate('#/types/uuid4', args.provider_id_string)
			.catch(function() {
				throw new Error('provider_id_string must be a 32-character UUID4 without dashes')
			});

		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.provider_id_string
				}
			},
			projection: {
				login: true,
				coming_soon: true,
				enabled: true,
				sources: true,
				remote_map_id: true,
				remote_map_id_string: true
			}
		});

		if (provider == null) {
			throw new httpErrors(404);
		}

		if (provider.enabled !== true) {
			throw new httpErrors(400, 'This Provider is not enabled');
		}

		if (provider.login !== true) {
			throw new httpErrors(400, 'You cannot log in or sign up using this Provider');
		}

		let remoteProvider = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

		let endpoints = [];
		let connection = {
			frequency: 1,
			enabled: true,
			permissions: {},

			provider: provider,
			remote_provider: remoteProvider,
			provider_id: provider._id
		};

		// Store valid endpoints.
		_.each(provider.sources, function(source, name) {
			if (_.has(args.permissions, name)) {
				connection.permissions[name] = {
					enabled: true,
					frequency: 1
				};

				endpoints.push(source.mapping);
			}
		});

		endpoints = _.uniq(endpoints);

		if (args.app_session === true) {
			appSession = await CreateSession(context.req, context.req.user, {
				persist: true,
				pending: true
			});

			context.res.cookie(config.sessions.cookieName, appSession.token, {
				domain: config.domain,
				secure: true,
				httpOnly: true,
				expires: appSession.expires
			});
		}

		let authObj = await bitscoop.createConnection(provider.remote_map_id.toString('hex'), {
			name: args.name,
			endpoints: endpoints,
			redirect_url: remoteProvider.auth.redirect_url + '?map_id=' + provider.remote_map_id.toString('hex')
		});

		await insertAssociationSessions(context, authObj, appSession);

		await ConnectionTC.getResolver('createOne').resolve({
			args: {
				record: {
					id: uuid(),
					auth: {
						status: {
							complete: false
						},
						redirectUrl: authObj.redirectUrl
					},
					frequency: 1,
					enabled: true,
					permissions: connection.permissions,
					provider_name: connection.remote_provider.name,
					provider_id: connection.provider_id,
					remote_connection_id: uuid(authObj.id),
				}
			}
		});

		return authObj;
	}
});

ConnectionTC.addResolver({
	name: 'patchConnection',
	kind: 'mutation',
	type: patchType,
	args: {
		id: 'String!',
		enabled: 'Boolean',
		permissions: 'JSON',
		name: 'String',
		forceUnauthorized: 'Boolean',
	},
	resolve: async function({args, context}) {
		let bitscoopConnection, map;
		let bitscoop = env.bitscoop;
		let req = context.req;
		let permissions = args.permissions;
		let validate = env.validate;

		if (permissions) {
			_.each(permissions, function(enabled) {
				if (type(enabled) !== 'boolean') {
					throw httpErrors(400, 'Enabled must be a boolean');
				}
			});
		}

		try {
			await validate('#/types/uuid4', args.id)
		}
		catch (err) {
			throw httpErrors(404);
		}

		let connection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		if (!connection) {
			throw httpErrors(404);
		}

		if (connection.remote_connection_id) {
			bitscoopConnection = await bitscoop.getConnection(connection.remote_connection_id.toString('hex'));

			if (!bitscoopConnection) {
				throw httpErrors(404);
			}
		}

		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: connection.provider_id.toString('hex')
				}
			}
		});

		if (!provider) {
			throw httpErrors(404);
		}

		if (provider.remote_map_id != null) {
			map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

			if (!map) {
				throw httpErrors(404);
			}
		}

		if (!connection.permissions) {
			connection.permissions = {};
		}

		let explorerConnection = {
			permissions: _.cloneDeep(connection.permissions)
		};

		if (args.name) {
			bitscoopConnection.name = args.name;
		}

		if ('enabled' in args) {
			explorerConnection.enabled = args.enabled;
		}

		let permissionsUpdated = args.forceUnauthorized === true;

		_.each(permissions, function(value, name) {
			if (!connection.permissions.hasOwnProperty(name)) {
				explorerConnection.permissions[name] = {
					enabled: value,
					frequency: 1
				};

				if (value === true) {
					permissionsUpdated = true;
				}
			}
			else if (value !== connection.permissions[name].enabled) {
				explorerConnection.permissions[name].enabled = value;
				permissionsUpdated = true;
			}
		});

		if (permissionsUpdated && map && map.auth.type === 'oauth2') {
			explorerConnection['auth.status.authorized'] = false;
		}

		let scopes = [];
		let endpoints = [];

		_.each(provider.sources, function(source, name) {
			if (permissions && _.has(permissions, name) && permissions[name] === true) {
				connection.permissions[name] = {
					enabled: true,
					frequency: 1
				};

				//endpoints.push(source.mapping);
				//All of the below is only necessary until plat_190 is merged in. After that, you should be able to just use the above line and delete everything below.
				let visited = new Set();

				let handlers = map.endpoints[source.mapping];
				let defaultGet = handlers.hasOwnProperty('route') || handlers.hasOwnProperty('single') || handlers.hasOwnProperty('collection');

				if (defaultGet) {
					handlers = {
						GET: handlers
					};
				}

				_.each(handlers, function(handler, method) {
					let handlerScopes;

					if (visited.has(handler)) {
						return false;
					}

					visited.add(handler);

					if (defaultGet) {
						handlerScopes = handlers.scopes;
					}
					else {
						handlerScopes = handlers[method].scopes;
					}

					if (Array.isArray(handlerScopes)) {
						Array.prototype.push.apply(scopes, handlerScopes);
					}
				});
			}
		});

		_.each(provider.sources, function(source, name) {
			if (explorerConnection.permissions.hasOwnProperty(name) && explorerConnection.permissions[name].enabled) {
				endpoints.push(source.mapping);
			}
		});

		if (bitscoopConnection != null) {
			bitscoopConnection.endpoints = _.uniq(endpoints);
			bitscoopConnection.scopes = _.uniq(scopes);

			delete bitscoopConnection.map_id;
			delete bitscoopConnection.metadata;
			delete bitscoopConnection.auth;

			let response;

			try {
				response = await bitscoopConnection.save();
			}
			catch (err) {
				console.log(err); //eslint-disable-line no-console

				throw err;
			}

			if (response.redirectUrl) {
				if (!explorerConnection.auth) {
					explorerConnection.auth = {};
				}

				explorerConnection.auth.redirectUrl = response.redirectUrl;
				explorerConnection.last_run = null;
				explorerConnection.last_successful_run = null;

				if (args.forceUnauthorized) {
					explorerConnection.endpoint_data = {};
				}
			}
		}

		let updateResult = await ConnectionTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: connection._id.toString('hex')
				},
				record: explorerConnection
			}
		});

		env.pubSub.publish('connectionUpdated', updateResult.record);

		explorerConnection.id = args.id;

		return {
			connection: explorerConnection,
			reauthorize: _.get(explorerConnection, 'auth.status.authorized', null) === false
		};
	}
});

ConnectionTC.addResolver({
	name: 'eliminateConnection',
	kind: 'mutation',
	type: eliminateType,
	args: {
		id: 'String'
	},
	resolve: async function({args, context}) {
		let bitscoop = env.bitscoop;
		let req = context.req;

		await env.validate('#/types/uuid4', args.id)
			.catch(function() {
				throw new Error('id must be a 32-character UUID4 without dashes')
			});

		let connections = await ConnectionTC.getResolver('findMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		let providers = await ProviderTC.getResolver('findMany').resolve({});

		_.each(connections, function(connection) {
			connection.provider = _.find(providers, function(provider) {
				return provider.id === connection.provider_id_string;
			});
		});

		let loginConnections = _.filter(connections, function(connection) {
			return connection.provider.login === true;
		});

		if ((req.user.email == null || req.user.email.length === 0) && loginConnections.length === 1 && loginConnections[0]._id.toString('hex') === args.id) {
			throw new httpErrors(400, 'You cannot delete your last remaining connection without having an email associated with your account.');
		}

		let connection = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		if (!connection) {
			throw new httpErrors(404);
		}

		if (connection.remote_connection_id) {
			try {
				await bitscoop.getConnection(connection.remote_connection_id.toString('hex'));
			}
			catch (err) {
				console.log(err); //eslint-disable-line no-console
			}
		}

		await deleteConnection(connection._id.toString('hex'), req.user._id.toString('hex'));

		env.pubSub.publish('connectionDeleted', {id: connection._id.toString('hex'), user_id: req.user._id});

		context.res.status = 204;
	}
});

ConnectionTC.addResolver({
	name: 'getBrowserConnection',
	kind: 'query',
	type: ConnectionTC.getResolver('findOne').getType(),
	args: {
		browser: 'String!'
	},
	resolve: async function({args, context}) {
		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: extensionProviderMap[args.browser]
				}
			}
		});

		if (provider == null) {
			throw new httpErrors(404);
		}

		let result = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					browser: args.browser,
					provider_id_string: provider._id.toString('hex'),
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		return result;
	}
});

ConnectionTC.addResolver({
	name: 'createBrowserConnection',
	kind: 'mutation',
	type: ConnectionTC.getResolver('findOne').getType(),
	args: {
		browser: 'String!'
	},
	resolve: async function({args, context}) {
		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: extensionProviderMap[args.browser]
				}
			}
		});

		if (provider == null) {
			throw new httpErrors(404);
		}

		await mongoose.connection.db.collection('connections').updateOne({
				browser: args.browser,
				provider_id: provider._id,
				user_id: context.req.user._id
			},
			{
				$setOnInsert: {
					_id: uuid(uuid()),
					auth: {
						status: {
							authorized: true,
							complete: true
						}
					},
					browser: args.browser,
					frequency: 1,
					enabled: true,
					provider_name: args.browser + ' Extensions',
					provider_id: provider._id,
					user_id: context.req.user._id
				}
			},
			{
				upsert: true
			});

		let result = await ConnectionTC.getResolver('findOne').resolve({
			args: {
				filter: {
					browser: args.browser,
					provider_id_string: provider._id.toString('hex'),
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		return result;
	}
});


async function insertAssociationSessions(context, authObj, appSession) {
	if (context.req.user == null) {
		// Only run if the user is not logged in
		let connectionId = authObj.id;

		let id = uuid();
		let token = uuid();
		let expiration = moment.utc().add(600, 'seconds').toDate();

		let record = {
			id: id,
			token_string: token,
			connection_id_string: connectionId,
			ttl: expiration
		};

		if (appSession != null && appSession.token != null) {
			record.app_session_token = appSession.token
		}

		await AssociationSessionTC.getResolver('createOne').resolve({
			args: {
				record: record
			}
		});

		// Create cookie so user can login/signup after Oauth validation.
		context.res.cookie(config.login.cookieName, token.toString('hex'), {
			domain: config.domain,
			secure: true,
			httpOnly: true,
			expires: expiration
		});
	}

	return Promise.resolve();
}
