/* @flow */

import url from 'url';

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import mongoose from 'mongoose';
import {graphql} from 'graphql-compose';

import uuid from "../../lib/util/uuid";

import {ContactTC} from './contacts';
import {ContentTC} from './content';
import {TagTC} from "./tags";
import {add as addTags, remove as removeTags} from './templates/tag';
import {UserTC} from "./users";
import {SessionTC} from "./sessions";
import deleteConnection from "../../lib/util/delete-connection";
import {ConnectionTC} from "./connections";
import {ProviderTC} from "./providers";




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

		connection: {
			type: Buffer,
			index: false
		},

		connection_id_string: {
			type: String,
			get: function () {
				if (this.connection) {
					return this.connection.toString('hex');
				}
			},
			set: function (val) {
				if (this._conditions && this._conditions.connection_id_string) {
					this._conditions.connection = uuid(val);

					delete this._conditions.connection_id_string;
				}

				this.connection = uuid(val);
			}
		},

		contact_interaction_type: {
			type: String,
			index: false
		},

		contacts: {
			type: [Buffer],
			index: false
		},

		content: {
			type: [Buffer],
			index: false
		},

		context: {
			type: String,
			index: false
		},

		created: {
			type: Date,
			index: false
		},

		datetime: {
			type: Date,
			index: false
		},

		identifier: {
			type: String,
			index: false
		},

		provider: {
			type: String,
			index: false
		},

		provider_name: {
			type: String,
			index: false
		},

		source: {
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
			get: function () {
				return this.user_id.toString('hex')
			},
			set: function (val) {
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

			returned.id.$in = _.map(source.contacts, function(item) {
				return item.toString('hex');
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

			returned.id.$in = _.map(source.content, function(item) {
				return item.toString('hex');
			});

			return returned;
		},
	}
});

EventTC.addRelation('hydratedConnection', {
	resolver: () => ConnectionTC.getResolver('findOne'),
	prepareArgs: {
		filter: function(source) {
			return {
				id: source.connection.toString('hex')
			}
		},
	}
});


let specialSorts = {
	connection: {
		condition: 'connection',
		values: {
			provider_name: -1,
			connection: -1
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

EventTC.addResolver({
	name: 'addEventTags',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await addTags(context.req, args, EventTC);
	}
});

EventTC.addResolver({
	name: 'removeEventTags',
	kind: 'mutation',
	type: EventTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await removeTags(context.req, args, EventTC);
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
	resolve: async function({source, args, context, info}) {
		let count, documents;
		let validate = env.validate;

		let filters = args.filters ? JSON.parse(args.filters) : {};
		let suppliedFilters = filters;

		let query = {
			filters: filters,
			limit: args.limit,
			offset: args.offset,
			q: args.q,
			sortField: args.sortField,
			sortOrder: args.sortOrder
		};

		let suppliedSortField = query.sortField;
		let suppliedSortOrder = query.sortOrder;

		try {
			await validate('#/requests/search', query);
		} catch(err) {
			throw new httpErrors(400, 'Query was invalid')
		}

		if (query.limit > config.objectMaxLimit) {
			query.limit = config.objectMaxLimit;
		}

		let sort;

		let validationVal = query;

		let specialSort = false;

		for (let key in specialSorts) {
			if (!specialSorts.hasOwnProperty(key)) {
				break;
			}

			let field = specialSorts[key];

			if ((key === 'emptyQueryRelevance' && query.sortField === '_score' && query.q == null) || query.sortField === field.condition) {
				specialSort = true;
				sort = field.values;

				_.each(sort, function(val, name) {
					sort[name] = query.sortOrder === 'asc' ? 1 : -1;
				});
			}
		}

		if (specialSort === false) {
			sort = {
				[query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			}
		}

		if ((query.q != null && query.q.length > 0) || (query.filters != null && Object.keys(query.filters).length > 0)) {
			let contactOptions = {};

			let contentOptions = {};

			let eventOptions = {};

			if (_.has(query, 'filters.whoFilters') && query.filters.whoFilters.length > 0) {
				if (!contactOptions.hasOwnProperty('$and')) {
					contactOptions.$and = [];
				}

				contactOptions.$and.push({
					$or: query.filters.whoFilters
				});
			}

			if (_.has(query, 'filters.whatFilters') && query.filters.whatFilters.length > 0) {
				if (!contentOptions.hasOwnProperty('$and')) {
					contentOptions.$and = [];
				}

				contentOptions.$and.push({
					$or: query.filters.whatFilters
				});
			}

			if (_.has(query, 'filters.whenFilters') && query.filters.whenFilters.length > 0) {
				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				_.each(query.filters.whenFilters, function(filter) {
					if (filter.datetime.$gte) {
						filter.datetime.$gte = new Date(filter.datetime.$gte);
					}

					if (filter.datetime.$lte) {
						filter.datetime.$lte = new Date(filter.datetime.$lte);
					}
				});

				eventOptions.$and.push({
					$or: query.filters.whenFilters
				});
			}

			if (_.has(query, 'filters.whereFilters') && query.filters.whereFilters.length > 0) {
				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				eventOptions.$and.push({
					$or: query.filters.whereFilters
				});
			}

			if (_.has(query, 'filters.connectorFilters') && query.filters.connectorFilters.length > 0) {
				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				eventOptions.$and.push({
					$or: query.filters.connectorFilters
				});
			}

			if (_.has(query, 'filters.tagFilters') && query.filters.tagFilters.length > 0) {
				if (!contactOptions.hasOwnProperty('$and')) {
					contactOptions.$and = [];
				}

				if (!contentOptions.hasOwnProperty('$and')) {
					contentOptions.$and = [];
				}

				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				contactOptions.$and.push({
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
					}]
				});

				contentOptions.$and.push({
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
					}]
				});

				eventOptions.$and.push({
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
					}]
				});
			}

			if (query.q != null && query.q.length > 0) {
				contactOptions.$text = {
					$search: query.q
				};

				contentOptions.$text = {
					$search: query.q
				};

				eventOptions.$text = {
					$search: query.q
				};
			}

			if (Object.keys(contactOptions).length === 0) {
				contactOptions.intentionallyFail = true;
			}

			if (Object.keys(contentOptions).length === 0) {
				contentOptions.intentionallyFail = true;
			}

			if (Object.keys(eventOptions).length === 0) {
				eventOptions.intentionallyFail = true;
			}

			contactOptions.user_id = context.req.user._id;
			contentOptions.user_id = context.req.user._id;
			eventOptions.user_id = context.req.user._id;

			let contactResults = await ContactTC.getResolver('findMany').resolve({
				rawQuery: contactOptions,
				projection: {
					_id: true
				}
			});

			let contentResults = await ContentTC.getResolver('findMany').resolve({
				rawQuery: contentOptions,
				projection: {
					_id: true
				}
			});

			let eventResults = await EventTC.getResolver('findMany').resolve({
				rawQuery: eventOptions,
				projection: {
					_id: true
				}
			});

			let contactIds = _.map(contactResults, function(result) {
				return result._id;
			});

			let contentIds = _.map(contentResults, function(result) {
				return result._id;
			});

			let eventIds = _.map(eventResults, function(result) {
				return result._id;
			});

			let filter = {
				user_id_string: context.req.user._id.toString('hex'),
				OR: [
					{
						_id: {
							$in: eventIds
						}
					},
					{
						contacts: {
							$in: contactIds
						}
					},
					{
						content: {
							$in: contentIds
						}
					}
				]
			};

			let eventMatches = await EventTC.getResolver('findMany').resolve({
				args: {
					filter: filter,
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
				projection: {
					id: true,
					connection: true,
					connection_id_string: true,
					contacts: true,
					contact_interaction_type: true,
					content: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					tagMasks: true,
					type: true,
					updated: true
				}
			});

			// let contactMatches = await EventTC.getResolver('findMany').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex'),
			// 			contacts: {
			// 				$in: _.map(contactIds, function(id) {
			// 					return id;
			// 				})
			// 			}
			// 		},
			// 		sort: sort,
			// 		limit: query.limit,
			// 		offset: query.offset
			// 	},
			// 	projection: {
			// 		id: true,
			// 		connection: true,
			// 		connection_id_string: true,
			// 		contacts: true,
			// 		contact_interaction_type: true,
			// 		content: true,
			// 		context: true,
			// 		created: true,
			// 		datetime: true,
			// 		hydratedContacts: true,
			// 		hydratedContent: true,
			// 		provider_name: true,
			// 		source: true,
			// 		type: true,
			// 		updated: true
			// 	}
			// });
			//
			// let contentMatches = await EventTC.getResolver('findMany').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex'),
			// 			content: {
			// 				$in: _.map(contentIds, function(id) {
			// 					return id;
			// 				})
			// 			}
			// 		},
			// 		sort: sort,
			// 		limit: query.limit,
			// 		offset: query.offset
			// 	},
			// 	// sort: sort,
			// 	projection: {
			// 		id: true,
			// 		connection: true,
			// 		connection_id_string: true,
			// 		contacts: true,
			// 		contact_interaction_type: true,
			// 		content: true,
			// 		context: true,
			// 		created: true,
			// 		datetime: true,
			// 		hydratedContacts: true,
			// 		hydratedContent: true,
			// 		provider_name: true,
			// 		source: true,
			// 		type: true,
			// 		updated: true
			// 	}
			// });

			let eventMatchCount = await EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: context.req.user._id.toString('hex'),
						OR: [
							{
								id: {
									$in: _.map(eventIds, function (id) {
										return id.toString('hex');
									})
								}
							},
							{
								contacts: {
									$in: _.map(contactIds, function(id) {
										return id;
									})
								}
							},
							{
								content: {
									$in: _.map(contentIds, function(id) {
										return id;
									})
								}
							}
						]
					},
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
			});

			// let contactMatchCount = await EventTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex'),
			// 			contacts: {
			// 				$in: _.map(contactIds, function(id) {
			// 					return id;
			// 				})
			// 			}
			// 		},
			// 		sort: sort,
			// 		limit: query.limit,
			// 		offset: query.offset
			// 	}
			// });
			//
			// let contentMatchCount = await EventTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex'),
			// 			content: {
			// 				$in: _.map(contentIds, function(id) {
			// 					return id;
			// 				})
			// 			}
			// 		},
			// 		sort: sort,
			// 		limit: query.limit,
			// 		offset: query.offset
			// 	}
			// });

			documents = eventMatches;
			count = eventMatchCount;
			// documents = _.union(eventMatches, contactMatches, contentMatches);
			// count = eventMatchCount + contactMatchCount + contentMatchCount;
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
				},
				projection: {
					id: true,
					connection: true,
					connection_id_string: true,
					contacts: true,
					contact_interaction_type: true,
					content: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					tagMasks: true,
					type: true,
					updated: true
				}
			});

			let eventMatchCount = await EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: context.req.user._id.toString('hex')
					},
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
			});

			documents = eventMatches;
			count = eventMatchCount;
		}

		let q = validationVal.q;
		let sortField = validationVal.sortField;
		let sortOrder = validationVal.sortOrder;
		let limit = validationVal.limit;
		let offset = validationVal.offset;
		let prev = null;
		let next = null;

		if (offset !== 0) {
			prev = {
				url: url.format({
					protocol: 'https',
					hostname: 'app.lifescope.io',
					pathname: 'api/events'
				}),
				method: 'SEARCH',
				body: {
					limit: limit,
					offset: Math.max(0, offset - limit),
					q: q,
					filters: suppliedFilters,
					sortField: sortField,
					sortOrder: sortOrder
				}
			};
		}

		if (limit + offset < count) {
			next = {
				url: url.format({
					protocol: 'https',
					hostname: 'app.lifescope.io',
					pathname: 'api/events'
				}),
				method: 'SEARCH',
				body: {
					limit: limit,
					offset: offset + limit,
					q: q,
					filters: suppliedFilters,
					sortField: suppliedSortField,
					sortOrder: suppliedSortOrder
				}
			};
		}

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