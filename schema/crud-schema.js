/* @flow */

import {SchemaComposer} from 'graphql-compose';
import {withFilter} from 'graphql-subscriptions';
import uuid from 'uuid/v4';

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
		connectionBrowserOne: ConnectionTC.getResolver('getBrowserConnection'),
		connectionCount: ConnectionTC.getResolver('count'),
		connectionMany: ConnectionTC.getResolver('findMany'),
		connectionOne: ConnectionTC.getResolver('findOne'),

		contactCount: ContactTC.getResolver('count'),
		contactMany: ContactTC.getResolver('findMany'),
		contactOne: ContactTC.getResolver('findOne'),

		contentCount: ContentTC.getResolver('count'),
		contentFindByIdentifier: ContentTC.getResolver('findByIdentifier'),

		eventCount: EventTC.getResolver('count'),
		eventMany: EventTC.getResolver('findMany'),
		eventOne: EventTC.getResolver('findOne'),

		locationCount: LocationTC.getResolver('count'),
		locationFindManyById: LocationTC.getResolver('findManyById'),

		locationFileCount: LocationFileTC.getResolver('count'),

		oauthAppMany: OAuthAppTC.getResolver('findMany'),
		oauthAppOne: OAuthAppTC.getResolver('findOne'),

		providerHydratedMany: ProviderTC.getResolver('providerHydratedMany'),

		searchCount: SearchTC.getResolver('count'),
		searchMany: SearchTC.getResolver('findMany'),
		searchOne: SearchTC.getResolver('findOne'),

		tagCount: TagTC.getResolver('count'),
		tagMany: TagTC.getResolver('findMany'),

		userOne: UserTC.getResolver('findOne'),
	}),

	oauthAppOneAuthorization: OAuthAppTC.getResolver('authorizationLimited')
});

GQC.rootMutation().addFields({
	...restrictToUser(Resolver, {
		connectionCreateBrowser: ConnectionTC.getResolver('createBrowserConnection'),
		connectionPatch: ConnectionTC.getResolver('patchConnection'),
		connectionEliminate: ConnectionTC.getResolver('eliminateConnection'),

		contactSearch: ContactTC.getResolver('searchContacts'),
		tagContact: ContactTC.getResolver('addContactTags'),
		untagContact: ContactTC.getResolver('removeContactTags'),

		contentSearch: ContentTC.getResolver('searchContent'),
		tagContent: ContentTC.getResolver('addContentTags'),
		untagContent: ContentTC.getResolver('removeContentTags'),

		eventCreateMany: EventTC.getResolver('bulkUpload'),
		eventSearch: EventTC.getResolver('searchEvents'),
		tagEvent: EventTC.getResolver('addEventTags'),
		untagEvent: EventTC.getResolver('removeEventTags'),
		deleteAccount: UserTC.getResolver('deleteAccount'),

		locationRecordOne: LocationTC.getResolver('recordOne'),
		trackedLocationsRemoveMany: LocationTC.getResolver('deleteTrackedLocations'),
		uploadedLocationsRemoveMany: LocationTC.getResolver('deleteUploadedLocations'),

		oauthAppDelete: OAuthAppTC.getResolver('deleteOne'),
		oauthAppInitialize: OAuthAppTC.getResolver('initializeOne'),
		oauthAppPatch: OAuthAppTC.getResolver('patchOne'),
		oauthAppResetClientSecret: OAuthAppTC.getResolver('resetClientSecret'),

		oauthTokenAuthorization: OAuthTokenTC.getResolver('authorization'),

		searchDelete: SearchTC.getResolver('deleteSearch'),
		searchFind: SearchTC.getResolver('findSearch'),
		searchPatch: SearchTC.getResolver('patchSearch'),
		searchUpsert: SearchTC.getResolver('upsertSearch'),

		tagUpdateSharing: TagTC.getResolver('updateSharing'),

		userApiKeyUpdate: UserTC.getResolver('updateApiKey'),
		userLocationTrackingUpdate: UserTC.getResolver('updateLocationTracking'),
		userThemeUpdate: UserTC.getResolver('updateTheme')
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