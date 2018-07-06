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

		eventCount: EventTC.getResolver('count'),
		eventMany: EventTC.getResolver('findMany'),
		eventOne: EventTC.getResolver('findOne'),

		providerHydratedMany: ProviderTC.getResolver('providerHydratedMany'),

		searchCount: SearchTC.getResolver('count'),
		searchMany: SearchTC.getResolver('findMany'),
		searchOne: SearchTC.getResolver('findOne'),

		tagMany: TagTC.getResolver('findMany'),

		userOne: UserTC.getResolver('findOne'),
	}),
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

		eventCreateMany: EventTC.getResolver('eventBulkUpload'),
		eventSearch: EventTC.getResolver('searchEvents'),
		tagEvent: EventTC.getResolver('addEventTags'),
		untagEvent: EventTC.getResolver('removeEventTags'),
		deleteAccount: UserTC.getResolver('deleteAccount'),

		locationRecordOne: LocationTC.getResolver('recordOne'),
		trackedLocationsRemoveMany: LocationTC.getResolver('deleteTrackedLocations'),

		searchDelete: SearchTC.getResolver('deleteSearch'),
		searchFind: SearchTC.getResolver('findSearch'),
		searchPatch: SearchTC.getResolver('patchSearch'),
		searchUpsert: SearchTC.getResolver('upsertSearch'),

		tagUpdateSharing: TagTC.getResolver('updateSharing'),

		userApiKeyUpdate: UserTC.getResolver('updateApiKey'),
		userLocationTrackingUpdate: UserTC.getResolver('updateLocationTracking')
	}),

	sharedTagContactSearch: ContactTC.getResolver('sharedTagSearch'),
	sharedTagContentSearch: ContentTC.getResolver('sharedTagSearch'),
	sharedTagEventSearch: EventTC.getResolver('sharedTagSearch'),

	initializeConnection: ConnectionTC.getResolver('initializeConnection')
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