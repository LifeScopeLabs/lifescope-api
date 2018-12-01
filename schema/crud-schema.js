/* @flow */

import {SchemaComposer} from 'graphql-compose';
import {withFilter} from 'graphql-subscriptions';
import uuid from 'uuid/v4';

import restrictByScope from '../lib/middleware/restrict-by-scope'
import restrictToUser from '../lib/middleware/restrict-to-user';
import {ConnectionTC} from './models/connections';
import {ContactTC} from './models/contacts';
import {ContentTC} from './models/content';
import {EventTC} from './models/events';
import {LocationTC} from './models/locations';
import {LocationFileTC} from './models/location-files';
import {OAuthAppTC} from './models/oauth-apps'
import {OAuthTokenTC} from "./models/oauth-tokens";
import {ProviderTC} from './models/providers';
import {SearchTC} from './models/searches';
import {SessionTC} from './models/sessions';
import {TagTC} from './models/tags';
// import { ThingTC } from './models/things';

import {UserTC} from './models/users';

const GQC = new SchemaComposer();

const {Resolver} = GQC;

// create GraphQL Schema with all available resolvers
GQC.rootQuery().addFields({

	providerOne: ProviderTC.getResolver('findOne'),
	providerMany: ProviderTC.getResolver('findMany'),
	providerTotal: ProviderTC.getResolver('count'),
	providerWithMapMany: ProviderTC.getResolver('providerWithMapMany'),
	providerWithMapOne: ProviderTC.getResolver('providerWithMapOne'),

	sessionOne: SessionTC.getResolver('findOne'),

	...restrictToUser(Resolver, {
		...restrictByScope(Resolver, 'connections:read', {
			connectionBrowserOne: ConnectionTC.getResolver('getBrowserConnection'),
			connectionCount: ConnectionTC.getResolver('count'),
			connectionMany: ConnectionTC.getResolver('findMany'),
			connectionOne: ConnectionTC.getResolver('findOne'),

			providerHydratedMany: ProviderTC.getResolver('providerHydratedMany'),
		}),

		...restrictByScope(Resolver, ['events:read', 'contacts:read'], {
			contactCount: ContactTC.getResolver('count'),
			contactOne: ContactTC.getResolver('findOne'),
			contactMany: ContactTC.getResolver('findMany')
		}),

		...restrictByScope(Resolver, ['events:read', 'content:read'], {
			contentCount: ContentTC.getResolver('count'),
			contentFindByIdentifier: ContentTC.getResolver('findByIdentifier'),
			contentOne: ContentTC.getResolver('findOne'),
			contentMany: ContentTC.getResolver('findMany')
		}),

		...restrictByScope(Resolver, 'events:read', {
			eventCount: EventTC.getResolver('count'),
			eventOne: EventTC.getResolver('findOne'),
			eventMany: EventTC.getResolver('findMany')
		}),

		...restrictByScope(Resolver, ['events:read', 'locations:read'], {
			locationCount: LocationTC.getResolver('count'),
			locationFindManyById: LocationTC.getResolver('findManyById'),
		}),

		...restrictByScope(Resolver, 'locationFiles:read', {
			locationFileCount: LocationFileTC.getResolver('count'),
		}),

		...restrictByScope(Resolver, 'oauthApps:read', {
			oauthAppMany: OAuthAppTC.getResolver('findMany'),
			oauthAppOne: OAuthAppTC.getResolver('findOne'),

			oauthAppAuthorizedMany: OAuthAppTC.getResolver('authorizedApps'),
		}),

		...restrictByScope(Resolver, 'searches:read', {
			searchCount: SearchTC.getResolver('count'),
			searchMany: SearchTC.getResolver('findMany'),
			searchOne: SearchTC.getResolver('findOne'),
		}),

		...restrictByScope(Resolver, 'tags:read', {
			tagCount: TagTC.getResolver('count'),
			tagMany: TagTC.getResolver('findMany'),
		}),

		...restrictByScope(Resolver, 'user:read', {
			userOne: UserTC.getResolver('findOne'),
		}),

		...restrictByScope(Resolver, 'basic', {
			userBasic: UserTC.getResolver('userBasic')
		}),
	}),

	oauthAppOneAuthorization: OAuthAppTC.getResolver('authorizationLimited')
});

GQC.rootMutation().addFields({
	...restrictToUser(Resolver, {
		...restrictByScope(Resolver, 'connections', {
			connectionCreateBrowser: ConnectionTC.getResolver('createBrowserConnection'),
			connectionPatch: ConnectionTC.getResolver('patchConnection'),
			connectionEliminate: ConnectionTC.getResolver('eliminateConnection'),
		}),

		...restrictByScope(Resolver, ['events:read', 'contacts:read'], {
			contactSearch: ContactTC.getResolver('searchContacts'),
		}),

		...restrictByScope(Resolver, 'contacts:write', {
			tagContact: ContactTC.getResolver('addContactTags'),
			untagContact: ContactTC.getResolver('removeContactTags'),
		}),

		...restrictByScope(Resolver, ['events:read', 'content:read'], {
			contentSearch: ContentTC.getResolver('searchContent'),
		}),

		...restrictByScope(Resolver, 'content:write', {
			tagContent: ContentTC.getResolver('addContentTags'),
			untagContent: ContentTC.getResolver('removeContentTags'),
		}),

		...restrictByScope(Resolver, 'events:read', {
			eventSearch: EventTC.getResolver('searchEvents'),
		}),

		...restrictByScope(Resolver, 'events:write', {
			eventCreateMany: EventTC.getResolver('bulkUpload'),
			tagEvent: EventTC.getResolver('addEventTags'),
			untagEvent: EventTC.getResolver('removeEventTags'),
		}),

		...restrictByScope(Resolver, 'account', {
			deleteAccount: UserTC.getResolver('deleteAccount'),
		}),

		...restrictByScope(Resolver, 'locations:write', {
			locationRecordOne: LocationTC.getResolver('recordOne'),
			trackedLocationsRemoveMany: LocationTC.getResolver('deleteTrackedLocations'),
			uploadedLocationsRemoveMany: LocationTC.getResolver('deleteUploadedLocations'),
		}),

		...restrictByScope(Resolver, 'oauthApps:write', {
			oauthAppDelete: OAuthAppTC.getResolver('deleteOne'),
			oauthAppInitialize: OAuthAppTC.getResolver('initializeOne'),
			oauthAppPatch: OAuthAppTC.getResolver('patchOne'),
			oauthAppResetClientSecret: OAuthAppTC.getResolver('resetClientSecret'),
			oauthAppTokensDelete: OAuthAppTC.getResolver('deleteTokens'),

			oauthAppRevokeTokens: OAuthAppTC.getResolver('revokeApp'),

			oauthTokenAuthorization: OAuthTokenTC.getResolver('authorization'),
		}),

		...restrictByScope(Resolver, 'searches:read', {
			searchFind: SearchTC.getResolver('findSearch'),
		}),

		...restrictByScope(Resolver, 'searches:write', {
			searchDelete: SearchTC.getResolver('deleteSearch'),
			searchPatch: SearchTC.getResolver('patchSearch'),
			searchUpsert: SearchTC.getResolver('upsertSearch'),
		}),

		...restrictByScope(Resolver, 'tags:write', {
			tagUpdateSharing: TagTC.getResolver('updateSharing'),
		}),

		...restrictByScope(Resolver, 'user:write', {
			userApiKeyUpdate: UserTC.getResolver('updateApiKey'),
			userLocationTrackingUpdate: UserTC.getResolver('updateLocationTracking'),
			userThemeUpdate: UserTC.getResolver('updateTheme')
		}),
	}),

	sharedTagContactSearch: ContactTC.getResolver('sharedTagSearch'),
	sharedTagContentSearch: ContentTC.getResolver('sharedTagSearch'),
	sharedTagEventSearch: EventTC.getResolver('sharedTagSearch'),

	initializeConnection: ConnectionTC.getResolver('initializeConnection'),

	oauthTokenAccessToken: OAuthTokenTC.getResolver('token'),
});


const filtered = (asyncIterator, filter) => withFilter(
	() => asyncIterator,
	filter,
);

GQC.rootSubscription().addFields({
	connectionUpdated: {
		type: ConnectionTC.getResolver('findOne').getType(),
		description: "Subscribe to connectionUpdated",
		resolve: (payload) => payload,
		subscribe: (_, args, context, info) =>
			filtered(env.pubSub.asyncIterator('connectionUpdated'),
				function(payload, variables) {
					if(context.user == null) {
						return false;
					}

					return context.user._id.toString('hex') === payload.user_id.toString('hex');
				})(_, args, context, info)
	},

	connectionDeleted: {
		type: ConnectionTC.getResolver('findOne').getType(),
		description: "Subscribe to connectionDeleted",
		resolve: (payload) => payload,
		subscribe: (_, args, context, info) =>
			filtered(env.pubSub.asyncIterator('connectionDeleted'),
				function(payload, variables) {
					if(context.user == null) {
						return false;
					}

					return context.user._id.toString('hex') === payload.user_id.toString('hex');
				})(_, args, context, info)
	}
});

const graphqlSchema = GQC.buildSchema();

export default graphqlSchema;