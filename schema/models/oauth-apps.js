/* @flow */

import crypto from 'crypto';

import _ from 'lodash';
import gqlCompose from 'graphql-compose';
import graphqlComposeMongoose from 'graphql-compose-mongoose';
import httpErrors from 'http-errors';
import mongoose from 'mongoose';

import { ConnectionTC } from './connections.js';
import { OAuthTokenTC } from './oauth-tokens.js';
import { ProviderTC } from './providers.js';
import uuid from '../../lib/util/uuid.js';

const { composeWithMongoose } = graphqlComposeMongoose;
const { schemaComposer, graphql } = gqlCompose;


let urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)$/;


let authorizationLimitedType = new graphql.GraphQLObjectType({
	name: 'authorizationLimited',
	fields: {
		client_id: {
			type: graphql.GraphQLString
		},
		description: {
			type: graphql.GraphQLString
		},
		homepage_url: {
			type: graphql.GraphQLString
		},
		name: {
			type: graphql.GraphQLString
		},
		privacy_policy_url: {
			type: graphql.GraphQLString
		}
	}
});


let authorizedAppType = schemaComposer.createObjectTC(`
	type authorizedApps {
		id: String,
		description: String,
		name: String,
		scopes: [String]
	}
`);


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
		collection: 'oauth_apps',
	}
);


export const OauthApps = mongoose.model('OAuthApp', OAuthAppSchema);

export const OAuthAppTC = composeWithMongoose(OauthApps);


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
	resolve: async function({args, context}) {
		if (urlRegex.test(args.privacy_policy_url !== true)) {
			return httpErrors(400, 'Invalid privacy policy URL');
		}

		if (urlRegex.test(args.homepage_url) !== true) {
			return httpErrors(400, 'Invalid homepage URL');
		}

		let providerId = uuid();

		let newApp = {
			id: uuid(),
			client_id: crypto.randomBytes(8).toString('hex'),
			client_secret: crypto.randomBytes(32).toString('hex'),
			redirect_uris: [],
			name: args.name,
			description: args.description,
			privacy_policy_url: args.privacy_policy_url,
			homepage_url: args.homepage_url,
			provider_id_string: providerId.toString('hex'),
			user_id_string: context.req.user._id.toString('hex')
		};

		let result = await OAuthAppTC.getResolver('createOne').resolve({
			args: {
				record: newApp
			}
		});

		let newProvider = {
			id: providerId.toString('hex'),
			name: args.name,
			login: false,
			oauth_app: true,
			oauth_app_id_string: result.record._id.toString('hex'),
			enabled: true
		};

		await ProviderTC.getResolver('createOne').resolve({
			args: {
				record: newProvider
			}
		});

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
		homepage_url: 'String',
		redirect_uris: ['String']
	},
	resolve: async function({args, context}) {
		if (urlRegex.test(args.privacy_policy_url !== true)) {
			return httpErrors(400, 'Invalid privacy policy URL');
		}

		if (urlRegex.test(args.homepage_url) !== true) {
			return httpErrors(400, 'Invalid homepage URL');
		}

		let update = {};

		if (args.name) {
			update.name = args.name;
		}

		if (args.description) {
			update.description = args.description;
		}

		if (args.privacy_policy_url) {
			update.privacy_policy_url = args.privacy_policy_url;
		}

		if (args.homepage_url) {
			update.homepage_url = args.homepage_url;
		}

		if (args.redirect_uris) {
			update.redirect_uris = _.uniq(args.redirect_uris);
		}

		if (Object.keys(update).length > 0) {
			let result = await OAuthAppTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: context.req.user._id.toString('hex')
					},
					record: update
				}
			});

			if (update.name) {
				let provider = await ProviderTC.getResolver('findOne').resolve({
					args: {
						filter: {
							oauth_app_id_string: args.id,
							user_id_string: context.req.user._id.toString('hex')
						}
					}
				});

				await ProviderTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							oauth_app_id_string: args.id,
							user_id_string: context.req.user._id.toString('hex')
						},
						record: {
							name: update.name
						}
					}
				});

				await ConnectionTC.getResolver('updateMany').resolve({
					args: {
						filter: {
							provider_id_string: provider._id.toString('hex')
						},
						record: {
							oauth_app_name: update.name,
							provider_name: update.name
						}
					}
				})
			}

			return result.record;
		}
		else {
			let result = await OAuthAppTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: context.req.user._id.toString('hex')
					}
				}
			});

			return result;
		}
	}
});


OAuthAppTC.addResolver({
	name: 'resetClientSecret',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
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
	resolve: async function({args, context}) {
		try {
			await OAuthTokenTC.getResolver('removeMany').resolve({
				args: {
					filter: {
						app_id_string: args.id
					}
				}
			});

			await OAuthAppTC.getResolver('removeOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: context.req.user._id.toString('hex')
					}
				}
			});
		}
		catch (err) {
			throw new Error(err);
		}
	}
});


OAuthAppTC.addResolver({
	name: 'deleteTokens',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args}) {
		try {
			await OAuthTokenTC.getResolver('removeMany').resolve({
				args: {
					filter: {
						app_id_string: args.id
					}
				}
			});
		}
		catch (err) {
			throw new Error(err);
		}
	}
});


OAuthAppTC.addResolver({
	name: 'authorizationLimited',
	kind: 'query',
	type: authorizationLimitedType,
	args: {
		client_id: 'String!'
	},
	resolve: async function({args}) {
		let result = await OAuthAppTC.getResolver('findOne').resolve({
			args: {
				filter: {
					client_id: args.client_id
				}
			}
		});

		if (result != null) {
			return _.pick(result, ['client_id', 'description', 'name', 'privacy_policy_url', 'homepage_url']);
		}
		else {
			throw new Error('Invalid client_id');
		}
	}
});


OAuthAppTC.addResolver({
	name: 'authorizedApps',
	kind: 'query',
	type: [authorizedAppType],
	resolve: async function({context}) {
		let tokens = await OAuthTokenTC.getResolver('findMany').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let appIds = [];
		let appScopes = {};

		_.each(tokens, function(token) {
			let appScope = appScopes[token.app_id.toString('hex')];

			appIds.push(token.app_id.toString('hex'));

			appScopes[token.app_id.toString('hex')] = appScope && Array.isArray(appScope) ? _.merge(appScope, token.scopes) : token.scopes;
		});

		appIds = _.uniq(appIds);

		let apps = await OAuthAppTC.getResolver('findMany').resolve({
			args: {
				filter: {
					id: {
						$in: appIds
					}
				}
			}
		});

		let returned = _.map(apps, function(app) {
			let temp = _.pick(app, ['_id', 'name', 'description']);

			temp.id = temp._id.toString('hex');
			temp = _.omit(temp, ['_id']);
			temp.scopes = appScopes[temp.id];

			return temp;
		});

		return returned;
	}
});


OAuthAppTC.addResolver({
	name: 'revokeApp',
	kind: 'mutation',
	type: OAuthAppTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		await OAuthTokenTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					app_id_string: args.id,
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		return;
	}
});