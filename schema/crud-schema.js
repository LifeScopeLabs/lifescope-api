/* global env */

import gqlCompose from 'graphql-compose';
import gqlSubscriptions from 'graphql-subscriptions';

import restrictByScope from '../lib/middleware/restrict-by-scope.js';
import restrictToUser from '../lib/middleware/restrict-to-user.js';
import { ConnectionTC } from './models/connections.js';
import { ContactTC } from './models/contacts.js';
import { ContentTC } from './models/content.js';
import { DataRemovalConfirmationsTC } from './models/data-removal-confirmations.js';
import { EventTC } from './models/events.js';
import { LocationTC } from './models/locations.js';
import { LocationFileTC } from './models/location-files.js';
import { OAuthAppTC } from './models/oauth-apps.js';
import { OAuthTokenTC } from './models/oauth-tokens.js';
import { PeopleTC } from './models/people.js';
import { ProviderTC } from './models/providers.js';
import { SearchTC } from './models/searches.js';
import { TagTC } from './models/tags.js';
// import { ThingTC } from './models/things.js';

import { UserTC } from './models/users.js';

const { withFilter } = gqlSubscriptions;
const { SchemaComposer } = gqlCompose;

const GQC = new SchemaComposer();

// create GraphQL Schema with all available resolvers
GQC.Query.addFields({

	providerOne: ProviderTC.getResolver('findOne'),
	providerMany: ProviderTC.getResolver('findMany'),
	providerTotal: ProviderTC.getResolver('count'),
	providerWithMapMany: ProviderTC.getResolver('providerWithMapMany'),
	providerWithMapOne: ProviderTC.getResolver('providerWithMapOne'),

	// sessionOne: SessionTC.getResolver('findOne'),

	...restrictToUser({
		...restrictByScope('connections:read', {
			connectionBrowserOne: ConnectionTC.getResolver('getBrowserConnection'),
			connectionCount: ConnectionTC.getResolver('count'),
			connectionMany: ConnectionTC.getResolver('findMany'),
			connectionOne: ConnectionTC.getResolver('findOne'),

			providerHydratedMany: ProviderTC.getResolver('providerHydratedMany'),
			connectedOAuthProviderMany: ProviderTC.getResolver('connectedOAuthProviderMany'),
		}),

		...restrictByScope(['events:read', 'contacts:read', 'events:write', 'contacts:write'], {
			contactCount: ContactTC.getResolver('count'),
			contactOne: ContactTC.getResolver('findOne'),
			contactMany: ContactTC.getResolver('findMany'),
			contactUnpersoned: ContactTC.getResolver('unpersonedContacts'),
		}),

		...restrictByScope(['events:read', 'content:read', 'events:write', 'content:write'], {
			contentCount: ContentTC.getResolver('count'),
			contentFindByIdentifier: ContentTC.getResolver('findByIdentifier'),
			contentOne: ContentTC.getResolver('findOne'),
			contentMany: ContentTC.getResolver('findMany')
		}),

		...restrictByScope(['events:read', 'events:write'], {
			eventCount: EventTC.getResolver('count'),
			eventOne: EventTC.getResolver('findOne'),
			eventMany: EventTC.getResolver('findMany')
		}),

		...restrictByScope(['events:read', 'locations:read', 'events:write', 'locations:write'], {
			locationCount: LocationTC.getResolver('count'),
			locationFindManyById: LocationTC.getResolver('findManyById'),
		}),

		...restrictByScope('locationFiles:read', {
			locationFileCount: LocationFileTC.getResolver('count'),
		}),

		...restrictByScope('oauthApps:read', {
			oauthAppMany: OAuthAppTC.getResolver('findMany'),
			oauthAppOne: OAuthAppTC.getResolver('findOne'),

			oauthAppAuthorizedMany: OAuthAppTC.getResolver('authorizedApps'),
		}),

		...restrictByScope(['people:read', 'people:write'], {
			personCount: PeopleTC.getResolver('count'),
			personMany: PeopleTC.getResolver('findMany'),
			personOne: PeopleTC.getResolver('findOne')
		}),

		...restrictByScope('searches:read', {
			searchCount: SearchTC.getResolver('count'),
			searchMany: SearchTC.getResolver('findMany'),
			searchOne: SearchTC.getResolver('findOne'),
		}),

		...restrictByScope('tags:read', {
			tagCount: TagTC.getResolver('count'),
			tagMany: TagTC.getResolver('findMany'),
		}),

		...restrictByScope('user:read', {
			userOne: UserTC.getResolver('findOne'),
		}),

		...restrictByScope('basic', {
			userCounts: UserTC.getResolver('allCounts'),
			userBasic: UserTC.getResolver('userBasic')
		}),
	}),

	sharedTagSelfPerson: PeopleTC.getResolver('sharedSelfPerson'),

	oauthAppOneAuthorization: OAuthAppTC.getResolver('authorizationLimited'),

	dataRemovalConfirmationCheck: DataRemovalConfirmationsTC.getResolver('check')
});

GQC.Mutation.addFields({
	...restrictToUser({
		...restrictByScope('connections', {
			connectionCreateBrowser: ConnectionTC.getResolver('createBrowserConnection'),
			connectionPatch: ConnectionTC.getResolver('patchConnection'),
			connectionEliminate: ConnectionTC.getResolver('eliminateConnection'),
		}),

		...restrictByScope(['events:read', 'contacts:read', 'events:write', 'contacts:write'], {
			contactSearch: ContactTC.getResolver('searchContacts'),
		}),

		...restrictByScope(['contacts:write', 'events:write'], {
			tagContact: ContactTC.getResolver('addTags'),
			untagContact: ContactTC.getResolver('removeTags'),

			contactHide: ContactTC.getResolver('hide'),
			contactUnhide: ContactTC.getResolver('unhide'),
		}),

		...restrictByScope(['events:read', 'content:read', 'events:write', 'content:write'], {
			contentSearch: ContentTC.getResolver('searchContent'),
		}),

		...restrictByScope('content:write', {
			tagContent: ContentTC.getResolver('addTags'),
			untagContent: ContentTC.getResolver('removeTags'),

			contentHide: ContentTC.getResolver('hide'),
			contentUnhide: ContentTC.getResolver('unhide'),
		}),

		...restrictByScope(['events:read', 'events:write'], {
			eventSearch: EventTC.getResolver('searchEvents'),
		}),

		...restrictByScope('events:write', {
			eventCreateMany: EventTC.getResolver('bulkUpload'),
			tagEvent: EventTC.getResolver('addTags'),
			untagEvent: EventTC.getResolver('removeTags'),

			eventHide: EventTC.getResolver('hide'),
			eventUnhide: EventTC.getResolver('unhide'),
		}),

		...restrictByScope('account', {
			deleteAccount: UserTC.getResolver('deleteAccount'),
		}),

		...restrictByScope(['locations:write', 'events:write'], {
			locationRecordOne: LocationTC.getResolver('recordOne'),
		}),

		...restrictByScope('locations:admin', {
			trackedLocationsRemoveMany: LocationTC.getResolver('deleteTrackedLocations'),
			uploadedLocationsRemoveMany: LocationTC.getResolver('deleteUploadedLocations'),
		}),

		...restrictByScope('oauthApps:admin', {
			oauthAppDelete: OAuthAppTC.getResolver('deleteOne'),
			oauthAppInitialize: OAuthAppTC.getResolver('initializeOne'),
			oauthAppPatch: OAuthAppTC.getResolver('patchOne'),
			oauthAppResetClientSecret: OAuthAppTC.getResolver('resetClientSecret'),
			oauthAppTokensDelete: OAuthAppTC.getResolver('deleteTokens'),

			oauthAppRevokeTokens: OAuthAppTC.getResolver('revokeApp'),

			oauthTokenAuthorization: OAuthTokenTC.getResolver('authorization'),
		}),

		...restrictByScope(['people:read', 'people:write'], {
			personSearch: PeopleTC.getResolver('searchPeople')
		}),

		...restrictByScope('people:write', {
			personCreate: PeopleTC.getResolver('create'),
			personDelete: PeopleTC.getResolver('delete'),
			personUpdate: PeopleTC.getResolver('update'),

			tagPerson: PeopleTC.getResolver('addTags'),
			untagPerson: PeopleTC.getResolver('removeTags'),

			personHide: PeopleTC.getResolver('hide'),
			personUnhide: PeopleTC.getResolver('unhide'),
		}),

		...restrictByScope('searches:read', {
			searchFind: SearchTC.getResolver('findSearch'),
		}),

		...restrictByScope('searches:write', {
			searchDelete: SearchTC.getResolver('deleteSearch'),
			searchPatch: SearchTC.getResolver('patchSearch'),
			searchUpsert: SearchTC.getResolver('upsertSearch'),
		}),

		...restrictByScope('tags:write', {
			tagUpdateSharing: TagTC.getResolver('updateSharing'),
		}),

		...restrictByScope('user:write', {
			userApiKeyUpdate: UserTC.getResolver('updateApiKey'),
			userEmailUpdate: UserTC.getResolver('updateEmail'),
			userLocationTrackingUpdate: UserTC.getResolver('updateLocationTracking'),
			userNewsletterUpdate: UserTC.getResolver('updateNewsletter'),
			userThemeUpdate: UserTC.getResolver('updateTheme'),
			userTutorialComplete: UserTC.getResolver('completeTutorial'),
			userTutorialsReset: UserTC.getResolver('resetTutorials'),
		}),
	}),

	sharedTagContactSearch: ContactTC.getResolver('sharedTagSearch'),
	sharedTagContentSearch: ContentTC.getResolver('sharedTagSearch'),
	sharedTagEventSearch: EventTC.getResolver('sharedTagSearch'),
	sharedTagPersonSearch: PeopleTC.getResolver('sharedTagSearch'),

	initializeConnection: ConnectionTC.getResolver('initializeConnection'),

	oauthTokenAccessToken: OAuthTokenTC.getResolver('token'),
});


const filtered = (asyncIterator, filter) => withFilter(
	() => asyncIterator,
	filter,
);

GQC.Subscription.addFields({
	connectionUpdated: {
		type: ConnectionTC.getResolver('findOne').getType(),
		description: "Subscribe to connectionUpdated",
		resolve: (payload) => payload,
		subscribe: (_, args, context, info) =>
			filtered(env.pubSub.asyncIterator('connectionUpdated'),
				function(payload) {
					if (context.user == null) {
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
				function(payload) {
					if (context.user == null) {
						return false;
					}

					return context.user._id.toString('hex') === payload.user_id.toString('hex');
				})(_, args, context, info)
	}
});

const graphqlSchema = GQC.buildSchema();

export default graphqlSchema;