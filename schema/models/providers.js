/* global env */

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';
import { TypeComposer } from 'graphql-compose';

import uuid from '../../lib/util/uuid';
import { ConnectionTC } from "./connections";
import { OAuthAppTC } from './oauth-apps';


let hydratedProviderType = TypeComposer.create(`
	type hydratedProviderType {
		id: String,
		login: Boolean,
		oauth_app: Boolean,
		oauth_app_id: Buffer,
		oauth_app_id_string: String,
		coming_soon: Boolean,
		enabled: Boolean,
		sources: JSON,
		remote_map_id: Buffer,
		remote_map_id_string: String,
		assoc_count: Int,
		name: String,
		tags: [String]
	}
`);

let providerWithMapType = TypeComposer.create(`
	type providerWithMapType {
		id: String,
		auth_type: String,
		coming_soon: Boolean,
		enabled: Boolean,
		login: Boolean,
		oauth_app: Boolean,
		oauth_app_id: Buffer,
		oauth_app_id_string: String,
		sources: JSON,
		remote_map_id: Buffer,
		remote_map_id_string: String,
		name: String,
		tags: [String]
	}
`);

export const ProvidersSchema = new mongoose.Schema(
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

		coming_soon: {
			type: Boolean
		},

		enabled: {
			type: Boolean
		},

		login: {
			type: Boolean
		},

		name: {
			type: String
		},

		oauth_app: {
			type: Boolean
		},

		oauth_app_id: {
			type: Buffer
		},

		oauth_app_id_string: {
			type: String,
			get: function() {
				if (this.oauth_app_id) {
					return this.oauth_app_id.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.oauth_app_id_string) {
					this._conditions.oauth_app_id = uuid(val);

					delete this._conditions.oauth_app_id_string;
				}

				this.oauth_app_id = uuid(val);
			}
		},

		remote_map_id: {
			type: Buffer
		},

		remote_map_id_string: {
			type: String,
			get: function() {
				if (this.remote_map_id) {
					return this.remote_map_id.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.remote_map_id_string) {
					this._conditions.remote_map_id = uuid(val);

					delete this._conditions.remote_map_id_string;
				}

				this.remote_map_id = uuid(val);
			}
		},

		sources: {
			type: Object
		},
	},
	{
		collection: 'providers',
	}
);

export const Providers = mongoose.model('Providers', ProvidersSchema);

export const ProviderTC = composeWithMongoose(Providers);


ProviderTC.addResolver({
	name: 'providerHydratedMany',
	kind: 'query',
	type: [hydratedProviderType],
	resolve: async function({context}) {
		let bitscoop = env.bitscoop;

		let providers = await ProviderTC.getResolver('findMany').resolve({
			args: {
				filter: {
					oauth_app: {
						$ne: true
					}
				}
			}
		});

		let connections = await ConnectionTC.getResolver('findMany').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		await Promise.all(_.map(providers, async function(provider) {
			let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

			provider.assoc_count = 0;
			provider.name = map.name;
			provider.tags = map.tags;

			_.each(connections, function(connection) {
				if (provider._id.toString('hex') === connection.provider_id.toString('hex') && connection.auth.status.complete === true) {
					provider.assoc_count += 1;
				}
			});

			return Promise.resolve();
		}));

		return providers;
	}
});

ProviderTC.addResolver({
	name: 'providerWithMapMany',
	kind: 'query',
	type: [providerWithMapType],
	resolve: async function({args}) {
		let bitscoop = env.bitscoop;

		if (args.filter == null) {
			args.filter = {};
		}

		args.filter.oauth_app = {
			$ne: true
		};

		let providers = await ProviderTC.getResolver('findMany').resolve({
			args: args
		});

		await Promise.all(_.map(providers, async function(provider) {
			let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

			provider.name = map.name;
			provider.tags = map.tags;
			provider.auth_type = _.get(map, 'auth.type', 'none');

			return Promise.resolve();
		}));

		return providers;
	}
});

ProviderTC.addResolver({
	name: 'connectedOAuthProviderMany',
	kind: 'query',
	type: [hydratedProviderType],
	resolve: async function({context}) {
		let connections = await ConnectionTC.getResolver('findMany').resolve({
			args: {
				filter: {
					oauth_app_name: {
						$exists: true
					},
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let providerPromises = _.map(connections, async function(connection) {
			return ProviderTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: connection.provider_id.toString('hex')
					}
				}
			});
		});

		let providers = await Promise.all(providerPromises);

		await Promise.all(_.map(providers, async function(provider) {
			let oauthApp = await OAuthAppTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: provider.oauth_app_id.toString('hex')
					}
				}
			});

			provider.name = oauthApp.name;
		}));

		return providers;
	}
});

ProviderTC.addResolver({
	name: 'providerWithMapOne',
	kind: 'query',
	type: providerWithMapType,
	args: {
		id: 'String'
	},
	resolve: async function({args}) {
		let bitscoop = env.bitscoop;

		let provider = await ProviderTC.getResolver('findOne').resolve({
			args: args
		});

		if (provider.remote_map_id) {
			try {
				let map = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

				provider.name = map.name;
				provider.tags = map.tags;
				provider.auth_type = _.get(map, 'auth.type', 'none');

				return provider;
			}
			catch (err) {
				console.log(err); //eslint-disable-line no-console

				return err;
			}
		}
		else if (provider.oauth_app_id) {
			try {
				let oauthApp = await OAuthAppTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: provider.oauth_app_id.toString('hex')
						}
					}
				});

				provider.name = oauthApp.name;

				return provider;
			}
			catch(err) {
				console.log(err); //eslint-disable-line no-console

				return err;
			}
		}
	}
});