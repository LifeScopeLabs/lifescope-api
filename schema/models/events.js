/* global env */

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid';

import { Contacts, ContactTC } from './contacts';
import { Content, ContentTC } from './content';
import { add as addTags, remove as removeTags } from './templates/tag';
import { LocationTC } from './locations';
import { People, PeopleTC } from './people';
import { TagTC } from './tags';
import { UserTC } from './users';


// let searchType = new graphql.GraphQLObjectType({
// 	name: 'initializeConnection',
// 	fields: {
// 		count: graphql.GraphQLInt,
// 		limit: graphql.GraphQLInt,
// 		offset: graphql.GraphQLInt,
// 		sortField: graphql.GraphQLString,
// 		sortOrder: graphql.GraphQLString,
// 		prev: graphql.GraphQLString,
// 		next: graphql.GraphQLString,
// 		results: graphql.GraphQLObjectType
// 	}
// });


export const EventsSchema = new mongoose.Schema(
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

		contact_interaction_type: {
			type: String,
			index: false
		},

		contact_ids: {
			type: [Buffer],
			index: false
		},

		contact_id_strings: {
			type: [String],
			get: function() {
				if (this.contact_ids) {
					return _.map(this.contact_ids, function(contactId) {
						if (contactId != null) {
							return contactId.toString('hex');
						}
					});
				}
			}
		},

		content_ids: {
			type: [Buffer],
			index: false
		},

		content_id_strings: {
			type: [String],
			get: function() {
				if (this.content_ids) {
					return _.map(this.content_ids, function(contentId) {
						if (contentId != null) {
							return contentId.toString('hex');
						}
					});
				}
			}
		},

		context: {
			type: String,
			index: false
		},

		created: {
			type: Date,
			default: Date.now,
			index: false
		},

		datetime: {
			type: Date,
			index: false
		},

		duration:{
			type: Number,
			index: false
		},

		hidden: {
			type: Boolean,
			index: false
		},

		identifier: {
			type: String,
			index: false
		},

		location_id: {
			type: Buffer,
			index: false,
		},

		location_id_string: {
			type: String,
			get: function() {
				if (this.location_id) {
					return this.location_id.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.location_id_string) {
					this._conditions.location = uuid(val);

					delete this._conditions.location_id_string;
				}

				this.location_id = uuid(val);
			}
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

		tagMasks: {
			added: {
				type: [String]
			},
			removed: {
				type: [String]
			},
			source: {
				type: [String]
			}
		},

		type: {
			type: String,
			index: false
		},

		updated: {
			type: Date,
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
		},
	},
	{
		collection: 'events',
	}
);


export const Events = mongoose.model('Events', EventsSchema);

export const EventTC = composeWithMongoose(Events);


EventTC.addRelation('hydratedContacts', {
	resolver: () => ContactTC.getResolver('findMany'),
	prepareArgs: {
		filter: function(source) {
			let returned = {
				id: {
					$in: []
				}
			};

			_.each(source.contact_ids, function(item) {
				if (item != null) {
					returned.id.$in.push(item.toString('hex'));
				}
			});

			return returned;
		},
	}
});


EventTC.addRelation('hydratedPeople', {
	resolver: () => PeopleTC.getResolver('findMany'),
	prepareArgs: {
		filter: function(source) {
			let returned = {
				contact_ids: {
					$in: []
				}
			};

			_.each(source.contact_ids, function(item) {
				if (item != null) {
					returned.contact_ids.$in.push(item);
				}
			});

			return returned;
		},
	}
});

EventTC.addRelation('hydratedContent', {
	resolver: () => ContentTC.getResolver('findMany'),
	prepareArgs: {
		filter: function(source) {
			let returned = {
				id: {
					$in: []
				}
			};

			_.each(source.content_ids, function(item) {
				if (item != null) {
					returned.id.$in.push(item.toString('hex'));
				}
			});

			return returned;
		},
	}
});

EventTC.addRelation('hydratedLocation', {
	resolver: () => LocationTC.getResolver('findOne'),
	prepareArgs: {
		filter: function(source) {
			if (source.location_id != null) {
				return {
					id: source.location.toString('hex')
				};
			}
			else {
				return {
					id: {
						$in: []
					}
				};
			}
		}
	}
});


let specialSorts = {
	connection: {
		condition: 'connection',
		values: {
			provider_name: -1,
			connection_id: -1
		}
	},
	rawType: {
		condition: 'type',
		values: {
			type: -1,
			context: -1
		}
	},
	emptyQueryRelevance: {
		values: {
			datetime: -1
		}
	}
};

let stopwords = [
	'a', 
	'an', 
	'and', 
	'are', 
	'as', 
	'at', 
	'be', 
	'but', 
	'by',
	'for', 
	'if', 
	'in', 
	'into', 
	'is', 
	'it',
	'no', 
	'not', 
	'of', 
	'on', 
	'or', 
	'such',
	'that', 
	'the', 
	'their', 
	'then', 
	'there', 
	'these',
	'they', 
	'this', 
	'to', 
	'was', 
	'will', 
	'with'
];

EventTC.addResolver({
	name: 'addTags',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
		return await addTags(context.req, args, EventTC);
	}
});

EventTC.addResolver({
	name: 'removeTags',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
		return await removeTags(context.req, args, EventTC);
	}
});

EventTC.addResolver({
	name: 'hide',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await EventTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: context.req.user._id.toString('hex')
				},
				record: {
					hidden: true
				}
			}
		});
	}
});

EventTC.addResolver({
	name: 'unhide',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await EventTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: context.req.user._id.toString('hex')
				},
				record: {
					hidden: false
				}
			}
		});
	}
});

EventTC.addResolver({
	name: 'searchEvents',
	kind: 'mutation',
	type: EventTC.getResolver('findMany').getType(),
	args: {
		q: 'String',
		offset: 'Int',
		limit: 'Int',
		sortField: 'String',
		sortOrder: 'String',
		filters: 'String'
	},
	resolve: async function({args, context}) {
		let /*count,*/ documents;
		let validate = env.validate;

		let filters = args.filters ? JSON.parse(args.filters) : {};
		// let suppliedFilters = filters;

		let query = {
			filters: filters,
			limit: args.limit,
			offset: args.offset,
			q: args.q,
			sortField: args.sortField,
			sortOrder: args.sortOrder
		};

		// let suppliedSortField = query.sortField;
		// let suppliedSortOrder = query.sortOrder;

		try {
			await validate('#/requests/search', query);
		}
		catch (err) {
			throw new httpErrors(400, 'Query was invalid')
		}

		if (query.limit > config.objectMaxLimit) {
			query.limit = config.objectMaxLimit;
		}

		let sort, contentSort, contactSort;

		// let validationVal = query;

		let specialSort = false;

		for (let key in specialSorts) {
			if (!specialSorts.hasOwnProperty(key)) {
				break;
			}

			let field = specialSorts[key];

			if ((key === 'emptyQueryRelevance' && query.sortField === 'score' && (query.q == null || query.q.length === 0)) || query.sortField === field.condition) {
				specialSort = true;
				sort = field.values;

				_.each(sort, function(val, name) {
					sort[name] = query.sortOrder === 'asc' ? -1 : 1;
				});
			}
		}

		if (specialSort === false) {
			sort = {
				[query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			};

			contentSort = {
				['event.' + query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			};

			contactSort = {
				['event.' + query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			};
		}
		else {
			contactSort = {};
			contentSort = {};

			_.each(sort, function(val, key) {
				contactSort['event.' + key] = val;
				contentSort['event.' + key] = val;
			});
		}

		if (query.q != null && query.q.length > 0) {
			_.each(stopwords, function(stopword) {
				let regexp = new RegExp('^' + stopword + ' | ' + stopword + ' | ' + stopword + '$', 'g');

				query.q = query.q.replace(regexp, '');
			});

			//FIXME This is a hack to prevent things with :// triggering extremely long Mongo queries.
			//The root cause of why things like URLs take so long to search for should be researched and
			//a better solution implemented.
			query.q = query.q.replace(/:\/+/, ':/');
		}

		if ((query.q != null && query.q.length > 0) || (query.filters != null && Object.keys(query.filters).length > 0)) {
			let contactsSearched = false;
			let contentSearched = false;
			let eventsSearched = false;
			let peopleSearched = false;

			let contactPreLookupMatch = {
				user_id: context.req.user._id
			};

			let contentPreLookupMatch = {
				user_id: context.req.user._id
			};

			let eventMatch = {
				user_id: context.req.user._id
			};

			let peoplePreLookupMatch = {
				$or: [
					{
						self: {
							$ne: true
						}
					},
					{
						self: {
							$exists: false
						}
					}
				],
				user_id: context.req.user._id
			};

			let contactPostLookupMatch = {};
			let contentPostLookupMatch = {};
			let eventPostLookupMatch = {};
			let peoplePostLookupMatch = {};

			let contactSearchBeta = {};
			let contentSearchBeta = {};
			let eventSearchBeta = {};
			let peopleSearchBeta = {};

			let $contactEventLookup = {
				from: 'events',
				localField: '_id',
				foreignField: 'contact_ids',
				as: 'event'
			};

			let $contactContentLookup = {
				from: 'content',
				localField: 'event.content_ids',
				foreignField: '_id',
				as: 'content'
			};

			let $contentEventLookup = {
				from: 'events',
				localField: '_id',
				foreignField: 'content_ids',
				as: 'event'
			};

			let $contentContactLookup = {
				from: 'contacts',
				localField: 'event.contact_ids',
				foreignField: '_id',
				as: 'contact'
			};

			let $eventLocationLookup = {
				from: 'locations',
				localField: 'location_id',
				foreignField: '_id',
				as: 'hydratedLocation'
			};

			let $contactLocationLookup = {
				from: 'locations',
				localField: 'event.location_id',
				foreignField: '_id',
				as: 'hydratedLocation'
			};

			let $contentLocationLookup = {
				from: 'locations',
				localField: 'event.location_id',
				foreignField: '_id',
				as: 'hydratedLocation'
			};

			let $peopleEventLookup = {
				from: 'events',
				localField: 'contact_ids',
				foreignField: 'contact_ids',
				as: 'event'
			};

			let $peopleContentLookup = {
				from: 'content',
				localField: 'event.content_ids',
				foreignField: '_id',
				as: 'content'
			};

			let $peopleLocationLookup = {
				from: 'locations',
				localField: 'event.location_id',
				foreignField: '_id',
				as: 'hydratedLocation'
			};

			if (query.q != null && query.q.length > 0) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below is the old text search using Mongo's $text indexing.
					It's been replaced by the full text search that's included in Mongo Atlas as of 4.2.
					If this code is being run on a version of Mongo that doesn't support full text search, uncomment
					the following section and uncomment some more code below that's also headed by the all-caps line above.
				 */
				// contactPreLookupMatch.$text = {
				// 	$search: query.q
				// };
				//
				// contentPreLookupMatch.$text = {
				// 	$search: query.q
				// };
				//
				// eventMatch.$text = {
				// 	$search: query.q
				// };

				contactSearchBeta = {
					index: 'fulltext',
					search: {
						query: query.q,
						path: [
							'handle',
							'name'
						]
					}
				};

				contentSearchBeta = {
					index: 'fulltext',
					search: {
						query: query.q,
						path: [
							'file_extension',
							'owner',
							'text',
							'title',
							'type',
							'url',
						]
					}
				};

				eventSearchBeta = {
					index: 'fulltext',
					search: {
						query: query.q,
						path: [
							'provider_name',
							'type'
						]
					}
				};

				peopleSearchBeta = {
					index: 'fulltext',
					search: {
						query: query.q,
						path: [
							'first_name',
							'middle_name',
							'last_name'
						]
					}
				};

				contactsSearched = contentSearched = eventsSearched = peopleSearched = true;
			}

			if (_.has(query, 'filters.whoFilters') && query.filters.whoFilters.length > 0) {
				let contactFilters = [];
				let peopleFilters = [];

				_.each(query.filters.whoFilters, function(whoFilter) {
					if (whoFilter.text) {
						if (whoFilter.text.operand) {
							contactFilters.push({
								$and: [
									whoFilter.text.operand,
									{
										$or: [
											{
												name: whoFilter.text.text
											},
											{
												handle: whoFilter.text.text
											}
										]
									}
								]
							});

							peopleFilters.push({
								$and: [
									whoFilter.text.operand,
									{
										$or: [
											{
												first_name: whoFilter.text.text
											},
											{
												middle_name: whoFilter.text.text
											},
											{
												last_name: whoFilter.text.text
											}
										]
									}
								]
							});
						}
						else {
							contactFilters.push({
								$or: [
									{
										name: whoFilter.text.text
									},
									{
										handle: whoFilter.text.text
									}
								]
							});

							peopleFilters.push({
								$or: [
									{
										first_name: whoFilter.text.text
									},
									{
										middle_name: whoFilter.text.text
									},
									{
										last_name: whoFilter.text.text
									}
								]
							});
						}
					}
					else if (whoFilter.person_id_string) {
						if (whoFilter.person_id_string.operand) {
							let filter = {
								$and: [
									whoFilter.person_id_string.operand
								]
							};

							if (whoFilter.person_id_string.person_id_string) {
								filter.$and.push({
									_id: uuid(whoFilter.person_id_string.person_id_string)
								});
							}

							peopleFilters.push(filter);
						}
						else {
							peopleFilters.push({_id: uuid(whoFilter.person_id_string.person_id_string)});
						}
					}
				});

				if (contactFilters.length > 0) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: contactFilters
					});

					contactsSearched = true;
				}

				if (peopleFilters.length > 0) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: peopleFilters
					});

					peopleSearched = true;
				}
			}

			if (_.has(query, 'filters.whatFilters') && query.filters.whatFilters.length > 0) {
				if (contentPreLookupMatch.$and == null) {
					contentPreLookupMatch.$and = [];
				}

				let lookupWhatFilters = _.map(query.filters.whatFilters, function(filter) {
					return {
						'content.type': filter.type
					}
				});

				if (contactsSearched === true) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: lookupWhatFilters
					});
				}

				if (peopleSearched === true) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: lookupWhatFilters
					});
				}

				if (contactsSearched !== true && peopleSearched !== true) {
					contentPreLookupMatch.$and.push({
						$or: query.filters.whatFilters
					});

					contentSearched = true;
				}
			}

			if (_.has(query, 'filters.whenFilters') && query.filters.whenFilters.length > 0) {
				_.each(query.filters.whenFilters, function(filter) {
					if (filter.datetime.$gte) {
						filter.datetime.$gte = new Date(filter.datetime.$gte);
					}

					if (filter.datetime.$lte) {
						filter.datetime.$lte = new Date(filter.datetime.$lte);
					}
				});

				let lookupWhenFilters = _.map(query.filters.whenFilters, function(filter) {
					return {
						'event.datetime': filter.datetime
					};
				});

				if (contactsSearched === true) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: lookupWhenFilters
					});
				}

				if (peopleSearched === true) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: lookupWhenFilters
					});
				}

				if (contentSearched === true) {
					if (contentPostLookupMatch.$and == null) {
						contentPostLookupMatch.$and = [];
					}

					contentPostLookupMatch.$and.push({
						$or: lookupWhenFilters
					});
				}

				if (eventMatch.$and == null) {
					eventMatch.$and = [];
				}

				eventMatch.$and.push({
					$or: query.filters.whenFilters
				});
			}

			if (_.has(query, 'filters.whereFilters') && query.filters.whereFilters.length > 0) {
				if (contactsSearched === true) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: query.filters.whereFilters
					});
				}

				if (peopleSearched === true) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: query.filters.whereFilters
					});
				}


				if (contentSearched === true) {
					if (contentPostLookupMatch.$and == null) {
						contentPostLookupMatch.$and = [];
					}

					contentPostLookupMatch.$and.push({
						$or: query.filters.whereFilters
					});
				}

				if (eventPostLookupMatch.$and == null) {
					eventPostLookupMatch.$and = [];
				}

				eventPostLookupMatch.$and.push({
					$or: query.filters.whereFilters
				});
			}

			if (_.has(query, 'filters.connectorFilters') && query.filters.connectorFilters.length > 0) {
				_.each(query.filters.connectorFilters, function(filter) {
					if (filter.connection_id_string) {
						filter.connection_id = uuid(filter.connection_id_string);
						delete filter.connection_id_string;
					}
					else if (filter.provider_id_string) {
						filter.provider_id = uuid(filter.provider_id_string);
						delete filter.provider_id_string;
					}
				});

				let lookupConnectorFilters = _.map(query.filters.connectorFilters, function(filter) {
					if (filter.connection_id) {
						return {
							'event.connection_id': filter.connection_id
						};
					}
					else if (filter.provider_id) {
						return {
							'event.provider_id': filter.provider_id
						};
					}
				});

				if (contactsSearched === true) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: lookupConnectorFilters
					});
				}

				if (contentSearched === true) {
					if (contentPostLookupMatch.$and == null) {
						contentPostLookupMatch.$and = [];
					}

					contentPostLookupMatch.$and.push({
						$or: lookupConnectorFilters
					});
				}

				if (eventMatch.$and == null) {
					eventMatch.$and = [];
				}

				eventMatch.$and.push({
					$or: query.filters.connectorFilters
				});
			}

			if (_.has(query, 'filters.tagFilters') && query.filters.tagFilters.length > 0) {
				if (contactsSearched === true) {
					if (contactPostLookupMatch.$and == null) {
						contactPostLookupMatch.$and = [];
					}

					contactPostLookupMatch.$and.push({
						$or: [{
							$or: [{
								$and: [{
									'tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'content.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'content.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'content.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'content.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'event.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'event.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}]
					});
				}
				else {
					if (contactPreLookupMatch.$and == null) {
						contactPreLookupMatch.$and = [];
					}

					contactPreLookupMatch.$and.push({
						$or: [{
							$and: [{
								'tagMasks.source': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}, {
							$and: [{
								'tagMasks.added': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}]
					});
				}

				contactsSearched = true;

				if (peopleSearched === true) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: [{
							$or: [{
								$and: [{
									'tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'content.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'content.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'content.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'content.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'event.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'event.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}]
					});
				}
				else {
					if (peoplePreLookupMatch.$and == null) {
						peoplePreLookupMatch.$and = [];
					}

					peoplePreLookupMatch.$and.push({
						$or: [{
							$and: [{
								'tagMasks.source': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}, {
							$and: [{
								'tagMasks.added': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}]
					});
				}

				peopleSearched = true;

				if (contentSearched === true) {
					if (contentPostLookupMatch.$and == null) {
						contentPostLookupMatch.$and = [];
					}

					contentPostLookupMatch.$and.push({
						$or: [{
							$or: [{
								$and: [{
									'tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'contact.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'contact.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'contact.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'contact.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'event.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'event.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'event.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}, {
							$or: [{
								$and: [{
									'people.tagMasks.source': {
										$in: query.filters.tagFilters
									},

									'people.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}, {
								$and: [{
									'people.tagMasks.added': {
										$in: query.filters.tagFilters
									},

									'people.tagMasks.removed': {
										$nin: query.filters.tagFilters
									}
								}]
							}]
						}]
					});
				}
				else {
					if (contentPreLookupMatch.$and == null) {
						contentPreLookupMatch.$and = [];
					}

					contentPreLookupMatch.$and.push({
						$or: [{
							$and: [{
								'tagMasks.source': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}, {
							$and: [{
								'tagMasks.added': {
									$in: query.filters.tagFilters
								},

								'tagMasks.removed': {
									$nin: query.filters.tagFilters
								}
							}]
						}]
					});
				}

				contentSearched = true;

				if (eventMatch.$and == null) {
					eventMatch.$and = [];
				}

				eventMatch.$and.push({
					$or: [{
						$and: [{
							'tagMasks.source': {
								$in: query.filters.tagFilters
							},

							'tagMasks.removed': {
								$nin: query.filters.tagFilters
							}
						}]
					}, {
						$and: [{
							'tagMasks.added': {
								$in: query.filters.tagFilters
							},

							'tagMasks.removed': {
								$nin: query.filters.tagFilters
							}
						}]
					}]
				});
			}

			let contactAggregation;
			let contentAggregation;
			let eventAggregation;
			let peopleAggregation;

			if (contactsSearched === true) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below was what was used prior to the implementation of Mongo's full text search.
					It's basically just the graphql-compose-mongoose syntax, but had to be left out because
					graphql-compose-mongoose hadn't been updated to support the $searchBeta pipeline stage.
					Instead, we now use Mongo directly.
					If this code is ever being run where full text search isn't available, you could uncomment this
					stuff and comment out everything else.
					Or, just get comment out the code pushing the $searchBeta stage onto the pipeline.
				 */
				// contactAggregation
				// 	.searchBeta(contactSearchBeta)
				// 	.match(contactPreLookupMatch)
				// 	.lookup($contactEventLookup)
				// 	.unwind('$event')
				// 	.lookup($contactContentLookup)
				// 	.unwind({
				// 		path: '$content',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.lookup($contactLocationLookup)
				// 	.unwind({
				// 		path: '$hydratedLocation',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.match(contactPostLookupMatch)
				// 	.sort(contactSort)
				// 	.skip(query.offset)
				// 	.limit(query.limit)
				// 	.project({
				// 		_id: true,
				// 		'event._id': true
				// 	});

				let pipeline = [];

				let options = {
					maxTimeMS: 60000
				};

				if (Object.keys(contactSearchBeta).length > 0) {
					pipeline.push({
						$searchBeta: contactSearchBeta,
					});
				}

				pipeline.push({
					$match: contactPreLookupMatch
				},
				{
					$lookup: $contactEventLookup
				},
				{
					$unwind: '$event'
				},
				{
					$lookup: $contactContentLookup
				},
				{
					$unwind: {
						path: '$content',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: $contactLocationLookup
				},
				{
					$unwind: {
						path: '$hydratedLocation',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match: contactPostLookupMatch
				},
				{
					$sort: contactSort
				},
				{
					$skip: query.offset
				},
				{
					$limit: query.limit
				},
				{
					$project: {
						_id: true,
						'event._id': true
					}
				});

				contactAggregation = Contacts.collection.aggregate(pipeline, options);
			}

			if (peopleSearched === true) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below was what was used prior to the implementation of Mongo's full text search.
					It's basically just the graphql-compose-mongoose syntax, but had to be left out because
					graphql-compose-mongoose hadn't been updated to support the $searchBeta pipeline stage.
					Instead, we now use Mongo directly.
					If this code is ever being run where full text search isn't available, you could uncomment this
					stuff and comment out everything else.
					Or, just get comment out the code pushing the $searchBeta stage onto the pipeline.
				 */
				// peopleAggregation
				// 	.searchBeta(peopleSearchBeta)
				// 	.match(peoplePreLookupMatch)
				// 	.unwind('$contact_ids')
				// 	.lookup($peopleEventLookup)
				// 	.unwind('$event')
				// 	.lookup($peopleContentLookup)
				// 	.unwind({
				// 		path: '$content',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.lookup($peopleLocationLookup)
				// 	.unwind({
				// 		path: '$hydratedLocation',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.match(peoplePostLookupMatch)
				// 	.sort(contactSort)
				// 	.skip(query.offset)
				// 	.limit(query.limit)
				// 	.project({
				// 		_id: true,
				// 		'event._id': true
				// 	});

				let pipeline = [];

				let options = {
					maxTimeMS: 60000
				};

				if (Object.keys(peopleSearchBeta).length > 0) {
					pipeline.push({
						$searchBeta: peopleSearchBeta,
					});
				}

				pipeline.push({
					$match: peoplePreLookupMatch
				},
				{
					$unwind: '$contact_ids'
				},
				{
					$lookup: $peopleEventLookup
				},
				{
					$unwind: '$event'
				},
				{
					$lookup: $peopleContentLookup
				},
				{
					$unwind: {
						path: '$content',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: $peopleLocationLookup
				},
				{
					$unwind: {
						path: '$hydratedLoation',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match: peoplePostLookupMatch
				},
				{
					$sort: contactSort
				},
				{
					$skip: query.offset
				},
				{
					$limit: query.limit
				},
				{
					$project: {
						_id: true,
						'event._id': true,
						score: {
							$meta: 'searchScore'
						}
					}
				});

				peopleAggregation = People.collection.aggregate(pipeline, options);
			}

			if (contentSearched === true) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below was what was used prior to the implementation of Mongo's full text search.
					It's basically just the graphql-compose-mongoose syntax, but had to be left out because
					graphql-compose-mongoose hadn't been updated to support the $searchBeta pipeline stage.
					Instead, we now use Mongo directly.
					If this code is ever being run where full text search isn't available, you could uncomment this
					stuff and comment out everything else.
					Or, just get comment out the code pushing the $searchBeta stage onto the pipeline.
				 */
				// contentAggregation
				// 	.searchBeta(contentSearchBeta)
				// 	.match(contentPreLookupMatch)
				// 	.lookup($contentEventLookup)
				// 	.unwind('$event')
				// 	.lookup($contentContactLookup)
				// 	.unwind({
				// 		path: '$contact',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.lookup($contentLocationLookup)
				// 	.unwind({
				// 		path: '$hydratedLocation',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.match(contentPostLookupMatch)
				// 	.sort(contentSort)
				// 	.skip(query.offset)
				// 	.limit(query.limit)
				// 	.project({
				// 		_id: true,
				// 		'event._id': true
				// 	});

				let pipeline = [];

				let options = {
					maxTimeMS: 60000
				};

				if (Object.keys(contentSearchBeta).length > 0) {
					pipeline.push({
						$searchBeta: contentSearchBeta,
					});
				}

				pipeline.push({
					$match: contentPreLookupMatch
				},
				{
					$lookup: $contentEventLookup
				},
				{
					$unwind: '$event'
				},
				{
					$lookup: $contentContactLookup
				},
				{
					$unwind: {
						path: '$contact',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: $contentLocationLookup
				},
				{
					$unwind: {
						path: '$hydratedLocation',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match: contentPostLookupMatch
				},
				{
					$sort: contentSort
				},
				{
					$skip: query.offset
				},
				{
					$limit: query.limit
				},
				{
					$project: {
						_id: true,
						'event._id': true,
						score: {
							$meta: 'searchScore'
						}
					}
				});

				contentAggregation = Content.collection.aggregate(pipeline, options);
			}

			eventsSearched = (Object.keys(query.filters).length === 1 && Object.keys(query.filters)[0] === 'tagFilters') || (contactsSearched === false && contentSearched === false && peopleSearched === false) || (Object.keys(contactPreLookupMatch).length === 0 && Object.keys(peoplePreLookupMatch).length === 0 && Object.keys(contentPreLookupMatch).length === 0 && Object.keys(contactPostLookupMatch).length === 0 && Object.keys(peoplePostLookupMatch).length === 0 && Object.keys(contentPostLookupMatch).length === 0);

			if (eventsSearched === true) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below was what was used prior to the implementation of Mongo's full text search.
					It's basically just the graphql-compose-mongoose syntax, but had to be left out because
					graphql-compose-mongoose hadn't been updated to support the $searchBeta pipeline stage.
					Instead, we now use Mongo directly.
					If this code is ever being run where full text search isn't available, you could uncomment this
					stuff and comment out everything else.
					Or, just get comment out the code pushing the $searchBeta stage onto the pipeline.
				 */
				// eventAggregation
				// 	.searchBeta(eventSearchBeta)
				// 	.match(eventMatch)
				// 	.lookup($eventLocationLookup)
				// 	.unwind({
				// 		path: '$hydratedLocation',
				// 		preserveNullAndEmptyArrays: true
				// 	})
				// 	.match(eventPostLookupMatch)
				// 	.sort(sort)
				// 	.skip(query.offset)
				// 	.limit(query.limit)
				// 	.project({
				// 		_id: true
				// 	});

				let pipeline = [];

				let options = {
					maxTimeMS: 60000
				};

				if (Object.keys(eventSearchBeta).length > 0) {
					pipeline.push({
						$searchBeta: eventSearchBeta,
					});
				}

				pipeline.push({
					$match: eventMatch
				},
				{
					$lookup: $eventLocationLookup
				},
				{
					$unwind: {
						path: '$hydratedLocation',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match: eventPostLookupMatch
				},
				{
					$sort: sort
				},
				{
					$skip: query.offset
				},
				{
					$limit: query.limit
				},
				{
					$project: {
						_id: true,
						score: {
							$meta: 'searchScore'
						}
					}
				});

				eventAggregation = Events.collection.aggregate(pipeline, options);
			}

			let aggregatedContacts = contactsSearched === true ? await contactAggregation.toArray() : [];
			let aggregatedContent = contentSearched === true ? await contentAggregation.toArray() : [];
			let aggregatedEvents = eventsSearched === true ? await eventAggregation.toArray() : [];
			let aggregatedPeople = peopleSearched === true ? await peopleAggregation.toArray() : [];

			let eventIds = [];
			let eventIdStrings = [];

			if (query.q != null && query.q.length > 0) {
				let resultBlob = aggregatedContacts.concat(aggregatedContent).concat(aggregatedEvents).concat(aggregatedPeople);

				let sorted = _.sortBy(resultBlob, function(result) {
					return result.score
				});

				if (query.sortOrder === 'desc') {
					sorted = _.reverse(sorted);
				}

				_.forEachRight(sorted, function(item) {
					if (item.event) {
						eventIds.push(item.event._id);
						eventIdStrings.push(item.event._id.toString('hex'));
					}
					else {
						eventIds.push(item._id);
						eventIdStrings.push(item._id.toString('hex'));
					}
				});

				let filter = {
					user_id_string: context.req.user._id.toString('hex'),
					_id: {
						$in: eventIds
					}
				};

				let eventMatches = await EventTC.getResolver('findMany').resolve({
					args: {
						filter: filter
					}
				});

				eventMatches.sort(function(a, b) {
					return eventIdStrings.indexOf(a._id.toString('hex')) - eventIdStrings.indexOf(b._id.toString('hex'));
				});

				documents = eventMatches;
			}
			else {
				if (aggregatedContacts.length > 0) {
					_.each(aggregatedContacts, function(contact) {
						eventIds.push(contact.event._id);
					});
				}

				if (aggregatedContent.length > 0) {
					_.each(aggregatedContent, function(content) {
						eventIds.push(content.event._id);
					});
				}

				if (aggregatedEvents.length > 0) {
					_.each(aggregatedEvents, function(event) {
						eventIds.push(event._id);
					});
				}

				if (aggregatedPeople.length > 0) {
					_.each(aggregatedPeople, function(person) {
						eventIds.push(person.event._id);
					});
				}

				let filter = {
					user_id_string: context.req.user._id.toString('hex'),
					_id: {
						$in: eventIds
					}
				};

				let eventMatches = await EventTC.getResolver('findMany').resolve({
					args: {
						filter: filter,
						sort: sort
					}
				});

				// let eventMatchCount = await EventTC.getResolver('count').resolve({
				// 	args: {
				// 		filter: filter,
				// 		sort: sort
				// 	}
				// });

				documents = eventMatches;
				// count = eventMatchCount;
			}
		}
		else {
			let eventMatches = await EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						user_id_string: context.req.user._id.toString('hex')
					},
					sort: sort,
					limit: query.limit,
					skip: query.offset
				}
			});

			// let eventMatchCount = await EventTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex')
			// 		},
			// 		sort: sort
			// 	},
			// });

			documents = eventMatches;
			// count = eventMatchCount;
		}

		// let q = validationVal.q;
		// let sortField = validationVal.sortField;
		// let sortOrder = validationVal.sortOrder;
		// let limit = validationVal.limit;
		// let offset = validationVal.offset;
		// let prev = null;
		// let next = null;
		//
		// if (offset !== 0) {
		// 	prev = {
		// 		url: url.format({
		// 			protocol: 'https',
		// 			hostname: 'app.lifescope.io',
		// 			pathname: 'api/events'
		// 		}),
		// 		method: 'SEARCH',
		// 		body: {
		// 			limit: limit,
		// 			offset: Math.max(0, offset - limit),
		// 			q: q,
		// 			filters: suppliedFilters,
		// 			sortField: sortField,
		// 			sortOrder: sortOrder
		// 		}
		// 	};
		// }
		//
		// if (limit + offset < count) {
		// 	next = {
		// 		url: url.format({
		// 			protocol: 'https',
		// 			hostname: 'app.lifescope.io',
		// 			pathname: 'api/events'
		// 		}),
		// 		method: 'SEARCH',
		// 		body: {
		// 			limit: limit,
		// 			offset: offset + limit,
		// 			q: q,
		// 			filters: suppliedFilters,
		// 			sortField: suppliedSortField,
		// 			sortOrder: suppliedSortOrder
		// 		}
		// 	};
		// }

		return documents;
		// return {
		// 	count: count,
		// 	limit: limit,
		// 	offset: offset,
		// 	sortField: sortField,
		// 	sortOrder: sortOrder,
		// 	prev: prev,
		// 	next: next,
		// 	results: documents
		// };
	}
});


function MongoEvent(data) {
	this.connection_id = uuid(data.connection_id_string).buffer;
	this.contact_interaction_type = data.contact_interaction_type;
	this.context = data.context;
	this.datetime = new Date(data.datetime);
	this.identifier = data.identifier;
	//this.places = data.places;
	this.provider_id = uuid(data.provider_id_string).buffer;
	this.provider_name = data.provider_name.toLowerCase();
	this.source = data.source;
	this.tagMasks = data.tagMasks;
	this.type = data.type;
	this.updated = data.updated;
	this.user_id = data.user_id;

	if (data.contacts) {
		this.contact_ids = new Array(data.contacts.length);

		for (let i = 0; i < data.contacts.length; i++) {
			this.contact_ids[i] = data.contacts[i]._id;
		}
	}

	if (data.content) {
		this.content_ids = new Array(data.content.length);

		for (let i = 0; i < data.content.length; i++) {
			this.content_ids[i] = data.content[i]._id;
		}
	}

	if (data.things) {
		this.thing_ids = new Array(data.things.length);

		for (let i = 0; i < data.things.length; i++) {
			this.thing_ids[i] = data.things[i]._id;
		}
	}

	if (data.location) {
		this.location_id = data.location._id;
	}

	if (this.tagMasks == null) {
		delete this.tagMasks;
	}
}

EventTC.addResolver({
	name: 'bulkUpload',
	kind: 'mutation',
	type: [EventTC.getResolver('findOne').getType()],
	args: {
		events: 'String'
	},
	resolve: async function({args, context}) {
		let eventMap = {};
		let contactMap = {};
		let contentMap = {};
		let locationMap = {};
		let tagList = [];

		let bulkContacts = mongoose.connection.db.collection('contacts').initializeUnorderedBulkOp();
		let bulkContent = mongoose.connection.db.collection('content').initializeUnorderedBulkOp();
		let bulkEvents = mongoose.connection.db.collection('events').initializeUnorderedBulkOp();
		let bulkLocations = mongoose.connection.db.collection('locations').initializeUnorderedBulkOp();
		let bulkTags = mongoose.connection.db.collection('tags').initializeUnorderedBulkOp();

		let events = JSON.parse(args.events);

		let contactIdentifiers = [];
		let contentIdentifiers = [];
		let eventIdentifiers = [];
		let locationIdentifiers = [];

		_.each(events, function(event) {
			let contacts = event.contacts;

			_.each(contacts, function(contact) {
				if (contact.identifier) {
					if (contactMap[contact.identifier] == null) {
						if (contact.tagMasks == null) {
							contact.tagMasks = {};
						}

						if (contact.tagMasks.source == null) {
							contact.tagMasks.source = [];
						}

						contactMap[contact.identifier] = contact;

						_.each(contact.tagMasks.source, function(tag) {
							if (tagList.indexOf(tag) === -1) {
								tagList.push(tag);

								let data = {
									tag: tag,
									user_id: context.req.user._id,
									updated: moment().utc().toDate()
								};

								bulkTags.find({
									tag: tag,
									user_id: context.req.user._id
								})
									.upsert()
									.updateOne({
										$set: data,
										$setOnInsert: {
											_id: uuid(uuid()),
											created: data.updated
										}
									});
							}
						});

						contact.connection_id = uuid(contact.connection_id_string);
						contact.provider_id = uuid(contact.provider_id_string);
						contact.provider_name = event.provider_name.toLowerCase();
						contact.user_id = context.req.user._id;
						contact.updated = moment().utc().toDate();
						contact['tagMasks.source'] = contact.tagMasks.source;

						delete contact.connection_id_string;
						delete contact.provider_id_string;
						delete contact.tagMasks;

						contactIdentifiers.push(contact.identifier);

						bulkContacts.find({
							identifier: contact.identifier,
							user_id: context.req.user._id
						})
							.upsert()
							.updateOne({
								$set: contact,
								$setOnInsert: {
									_id: uuid(uuid()),
									created: contact.updated
								}
							});
					}
					else {
						contact = contactMap[contact.identifier];
					}
				}
			});

			let content = event.content;

			_.each(content, function(content) {
				if (content.identifier) {
					if (contentMap[content.identifier] == null) {
						if (content.tagMasks == null) {
							content.tagMasks = {};
						}

						if (content.tagMasks.source == null) {
							content.tagMasks.source = [];
						}

						contentMap[content.identifier] = content;

						_.each(content.tagMasks.source, function(tag) {
							if (tagList.indexOf(tag) === -1) {
								tagList.push(tag);

								let data = {
									tag: tag,
									user_id: context.req.user._id,
									updated: moment().utc().toDate()
								};

								bulkTags.find({
									tag: tag,
									user_id: context.req.user._id
								})
									.upsert()
									.updateOne({
										$set: data,
										$setOnInsert: {
											_id: uuid(uuid()),
											created: data.updated
										}
									});
							}
						});

						content.connection_id = uuid(content.connection_id_string);
						content.provider_id = uuid(content.provider_id_string);
						content.provider_name = event.provider_name.toLowerCase();
						content.user_id = context.req.user._id;
						content.updated = moment().utc().toDate();
						content['tagMasks.source'] = content.tagMasks.source;

						delete content.connection_id_string;
						delete content.provider_id_string;
						delete content.tagMasks;

						contentIdentifiers.push(content.identifier);

						bulkContent.find({
							identifier: content.identifier,
							user_id: context.req.user._id
						})
							.upsert()
							.updateOne({
								$set: content,
								$setOnInsert: {
									_id: uuid(uuid()),
									created: content.updated
								}
							});
					}
					else {
						content = contentMap[content.identifier];
					}
				}
			});

			if (event.location && event.location.identifier) {
				let location = event.location;

				locationMap[location.identifier] = location;

				location.connection_id = uuid(content.connection_id_string);
				location.provider_id = uuid(content.provider_id_string);
				location.provider_name = event.provider_name.toLowerCase();
				location.user_id = context.req.user._id;
				location.updated = moment().utc().toDate();

				delete location.connection_id_string;
				delete location.provider_id_string;

				locationIdentifiers.push(location.identifier);

				bulkLocations.find({
					identifier: location.identifier,
					user_id: context.req.user._id
				})
					.upsert()
					.updateOne({
						$set: location,
						$setOnInsert: {
							_id: uuid(uuid()),
							created: location.updated
						}
					});
			}
		});

		if (contactIdentifiers.length > 0) {
			await bulkContacts.execute();

			let hydratedContacts = await ContactTC.getResolver('findMany').resolve({
				args: {
					filter: {
						identifier: {
							$in: contactIdentifiers
						}
					}
				}
			});

			_.each(hydratedContacts, function(contact) {
				contactMap[contact.identifier]._id = uuid(contact.id);
				contactMap[contact.identifier].tagMasks = contact.tagMasks;

				delete contactMap[contact.identifier]['tagMasks.source'];
			});
		}

		if (contentIdentifiers.length > 0) {
			await bulkContent.execute();

			let hydratedContent = await ContentTC.getResolver('findMany').resolve({
				args: {
					filter: {
						identifier: {
							$in: contentIdentifiers
						}
					}
				}
			});

			_.each(hydratedContent, function(content) {
				contentMap[content.identifier]._id = uuid(content.id);
				contentMap[content.identifier].tagMasks = content.tagMasks;

				delete contentMap[content.identifier]['tagMasks.source'];
			});
		}

		if (locationIdentifiers.length > 0) {
			await bulkLocations.execute();

			let hydratedLocations = await LocationTC.getResolver('findMany').resolve({
				args: {
					filter: {
						identifier: {
							$in: locationIdentifiers
						}
					}
				}
			});

			_.each(hydratedLocations, function(location) {
				locationMap[location.identifier]._id = uuid(location.id);
			});
		}

		_.each(events, function(rawEvent) {
			_.each(rawEvent.contacts, function(contact) {
				let cache = contactMap[contact.identifier];

				contact._id = cache._id;
				contact.tagMasks = cache.tagMasks;
			});

			_.each(rawEvent.content, function(content) {
				let cache = contentMap[content.identifier];

				content._id = cache._id;
				content.tagMasks = cache.tagMasks;
			});

			if (rawEvent.location) {
				let cache = locationMap[rawEvent.location.identifier];

				rawEvent.location._id = cache._id;
			}

			let event = new MongoEvent(rawEvent);

			if (event.identifier) {
				if (eventMap[event.identifier] == null) {
					if (event.tagMasks == null) {
						event.tagMasks = {};
					}

					if (event.tagMasks.source == null) {
						event.tagMasks.source = [];
					}

					eventMap[event.identifier] = event;

					_.each(event.tagMasks.source, function(tag) {
						if (tagList.indexOf(tag) === -1) {
							tagList.push(tag);

							let data = {
								tag: tag,
								user_id: context.req.user._id,
								updated: moment().utc().toDate()
							};

							bulkTags.find({
								tag: tag,
								user_id: context.req.user._id
							})
								.upsert()
								.updateOne({
									$set: data,
									$setOnInsert: {
										_id: uuid(uuid()),
										created: data.updated
									}
								});
						}
					});

					event.user_id = context.req.user._id;
					event.updated = moment().utc().toDate();
					event['tagMasks.source'] = event.tagMasks.source;

					delete event.tagMasks;

					eventIdentifiers.push(event.identifier);

					bulkEvents.find({
						identifier: event.identifier,
						user_id: context.req.user._id
					})
						.upsert()
						.updateOne({
							$set: event,
							$setOnInsert: {
								_id: uuid(uuid()),
								created: event.updated
							}
						});
				}
			}
		});

		let hydratedEvents = [];

		if (eventIdentifiers.length > 0) {
			await bulkEvents.execute();

			hydratedEvents = await EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						identifier: {
							$in: eventIdentifiers
						}
					}
				}
			})
		}

		if (tagList.length > 0) {
			await bulkTags.execute();
		}

		return hydratedEvents;
	}
});

EventTC.addResolver({
	name: 'sharedTagSearch',
	kind: 'mutation',
	type: EventTC.getResolver('findMany').getType(),
	args: {
		id: 'String!',
		offset: 'Int',
		limit: 'Int',
		passcode: 'String!',
		sortField: 'String',
		sortOrder: 'String'
	},
	resolve: async function({args, context}) {
		let userResult;

		if (args.id == null || args.passcode == null) {
			throw new httpErrors(404);
		}

		let tagResult = await TagTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.id,
					share: 'public',
					passcode: args.passcode
				}
			}
		});

		if (tagResult != null) {
			userResult = await UserTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: tagResult.user_id.toString('hex')
					}
				}
			});

			if (userResult == null) {
				throw new httpErrors(404);
			}

			context.req.user = userResult;
		}
		else {
			throw new httpErrors(404);
		}

		let filters = {
			tagFilters: [
				tagResult.tag
			]
		};

		let searchResult = await EventTC.getResolver('searchEvents').resolve({
			args: {
				offset: args.offset,
				limit: args.limit,
				filters: JSON.stringify(filters),
				sortField: args.sortField,
				sortOrder: args.sortOrder
			},
			context: context
		});

		return searchResult;
	}
});