/* @flow */

import url from 'url';

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import mongoose from 'mongoose';
import {graphql} from 'graphql-compose';

import uuid from "../../lib/util/uuid";

import {Contacts, ContactTC} from './contacts';
import {Content, ContentTC} from './content';
import {add as addTags, remove as removeTags} from './templates/tag';
import {ConnectionTC} from "./connections";


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
			let contactsSearched = false;
			let contentSearched = false;
			let eventsSearched = false;

			let contactAggregation = Contacts.aggregate();
			let contentAggregation = Content.aggregate();
			let eventAggregation = Events.aggregate();

			let contactPreLookupMatch = {
				user_id: context.req.user._id
			};

			let contentPreLookupMatch = {
				user_id: context.req.user._id
			};

			let eventMatch = {
				user_id: context.req.user._id
			};

			let contactPostLookupMatch = {};
			let contentPostLookupMatch = {};

			let $contactEventLookup = {
				from: 'events',
				localField: '_id',
				foreignField: 'contacts',
				as: 'event'
			};

			let $contactContentLookup = {
				from: 'content',
				localField: 'event.content',
				foreignField: '_id',
				as: 'content'
			};

			let $contentEventLookup = {
				from: 'events',
				localField: '_id',
				foreignField: 'content',
				as: 'event'
			};

			let $contentContactLookup = {
				from: 'contacts',
				localField: 'event.contacts',
				foreignField: '_id',
				as: 'contact'
			};

			if (query.q != null && query.q.length > 0) {
				contactPreLookupMatch.$text = {
					$search: query.q
				};

				contentPreLookupMatch.$text = {
					$search: query.q
				};

				eventMatch.$text = {
					$search: query.q
				};

				contactsSearched = contentSearched = eventsSearched = true;
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
					if (contentPreLookupMatch.$and == null) {
						contactPreLookupMatch.$and = [];
					}

					contactPreLookupMatch.$and.push({
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

				contactsSearched = true;

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
						}]
					});
				}
				else {
					if (contentPreLookupMatch.$and == null) {
						contentPreLookupMatch.$and = [];
					}

					contentPreLookupMatch.$and.push({
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

				contentSearched = true;

				if (eventMatch.$and == null) {
					eventMatch.$and = [];
				}

				eventMatch.$and.push({
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

				eventsSearched = true;
			}

			if (_.has(query, 'filters.whoFilters') && query.filters.whoFilters.length > 0) {
				if (contactPostLookupMatch.$and == null) {
					contactPostLookupMatch.$and = [];
				}

				contactPostLookupMatch.$and.push({
					$or: query.filters.whoFilters
				});

				contactsSearched = true;
			}

			if (_.has(query, 'filters.whatFilters') && query.filters.whatFilters.length > 0) {
				if (contentPreLookupMatch.$and == null) {
					contentPreLookupMatch.$and = [];
				}

				contentPreLookupMatch.$and.push({
					$or: query.filters.whatFilters
				});

				contentSearched = true;
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

			// if (_.has(query, 'filters.whereFilters') && query.filters.whereFilters.length > 0) {
			// 	contactAggregation.match({
			// 		'events.location': {
			// 			$or: query.filters.whereFilters
			// 		}
			// 	});
			//
			// 	contentAggregation.match({
			// 		'events.location': {
			// 			$or: query.filters.whereFilters
			// 		}
			// 	});
			//
			// 	eventAggregation.match({
			// 		$or: query.filters.whereFilters
			// 	});
			// }

			if (_.has(query, 'filters.connectorFilters') && query.filters.connectorFilters.length > 0) {
				let lookupConnectorFilters = _.map(query.filters.connectorFilters, function(filter) {
					return filter.connection ? {
						'event.connection': filter.connection
					} : {
						'event.provider_name': filter.provider_name
					};
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

			if (contactsSearched === true) {
				contactAggregation
					.match(contactPreLookupMatch)
					.lookup($contactEventLookup)
					.unwind('$event')
					.lookup($contactContentLookup)
					.unwind('$content')
					.match(contactPostLookupMatch)
					.project({
						_id: true,
						'event._id': true
					});

			}

			if (contentSearched === true) {
				contentAggregation
					.match(contentPreLookupMatch)
					.lookup($contentEventLookup)
					.unwind('$event')
					.lookup($contentContactLookup)
					.unwind('$contact')
					.match(contentPostLookupMatch)
					.project({
						_id: true,
						'event._id': true
					});
			}

			if (eventsSearched === true) {
				eventAggregation
					.match(eventMatch)
					.project({
						_id: true
					});
			}

			let aggregatedContacts = contactsSearched === true ? await contactAggregation.exec() : [];
			let aggregatedContent = contentSearched === true ? await contentAggregation.exec(): [];
			let aggregatedEvents = eventsSearched === true ? await eventAggregation.exec() : [];

			let eventIds = [];

			if (aggregatedContacts.length > 0) {
				_.each(aggregatedContacts, function (contact) {
					eventIds.push(contact.event._id);
				});
			}

			if (aggregatedContent.length > 0) {
				_.each(aggregatedContent, function (content) {
					eventIds.push(content.event._id);
				});
			}

			if (aggregatedEvents.length > 0) {
				_.each(aggregatedEvents, function (event) {
					eventIds.push(event._id);
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

			let eventMatchCount = await EventTC.getResolver('count').resolve({
				args: {
					filter: filter,
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
			});

			documents = eventMatches;
			count = eventMatchCount;

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