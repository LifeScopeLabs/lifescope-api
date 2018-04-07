/* @flow */


import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';
import {TypeComposer, graphql} from 'graphql-compose';

import uuid from '../../lib/util/uuid';
import {ConnectionTC} from "./connections";


let hydratedProviderType = TypeComposer.create(`
	type hydratedProviderType {
		id: String,
		sources: JSON,
		remote_map_id: Buffer,
		remote_map_id_string: String,
		assoc_count: Int,
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


ProviderTC.addResolver({
	name: 'providerManyHydrated',
	kind: 'query',
	type: [hydratedProviderType],
	args: {},
	resolve: async function({source, args, context, info}) {
		let bitscoop = env.bitscoop;

		let providers = await ProviderTC.getResolver('findMany').resolve({});

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