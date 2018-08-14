/* @flow */

import url from 'url';

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';
import {graphql} from 'graphql-compose';

import uuid from "../../lib/util/uuid";

import {Contacts, ContactTC} from './contacts';
import {Content, ContentTC} from './content';
import {add as addTags, remove as removeTags} from './templates/tag';
import {ConnectionTC} from "./connections";
import {Locations, LocationTC} from "./locations";
import {TagTC} from "./tags";
import {UserTC} from "./users";


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
			default: Date.now,
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

		location: {
			type: Buffer,
			index: false,
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
			get: function() {
				return this.user_id.toString('hex')
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

			_.each(source.contacts, function(item) {
				if (item != null) {
					returned.id.$in.push(item.toString('hex'));
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

			_.each(source.content, function(item) {
				if (item != null) {
					returned.id.$in.push(item.toString('hex'));
				}
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
				id: source.connection_id.toString('hex')
			}
		},
	}
});

EventTC.addRelation('hydratedLocation', {
	resolver: () => LocationTC.getResolver('findOne'),
	prepareArgs: {
		filter: function(source) {
			if (source.location != null) {
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

			if (contactsSearched === true) {
				contactAggregation
					.match(contactPreLookupMatch)
					.lookup($contactEventLookup)
					.unwind('$event')
					.lookup($contactContentLookup)
					.unwind({
						path: '$content',
						preserveNullAndEmptyArrays: true
					})
					.match(contactPostLookupMatch)
					.skip(query.offset)
					.limit(query.limit)
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
					.unwind({
						path: '$contact',
						preserveNullAndEmptyArrays: true
					})
					.match(contentPostLookupMatch)
					.skip(query.offset)
					.limit(query.limit)
					.project({
						_id: true,
						'event._id': true
					});
			}

			eventsSearched = (Object.keys(query.filters).length === 1 && Object.keys(query.filters)[0] === 'tagFilters') || (contactsSearched === false && contentSearched === false) || (Object.keys(contactPreLookupMatch).length === 0 && Object.keys(contentPreLookupMatch).length === 0 && Object.keys(contactPostLookupMatch).length === 0 && Object.keys(contentPostLookupMatch).length === 0);

			if (eventsSearched === true) {
				eventAggregation
					.match(eventMatch)
					.skip(query.offset)
					.limit(query.limit)
					.project({
						_id: true
					});
			}

			let aggregatedContacts = contactsSearched === true ? await contactAggregation.exec() : [];
			let aggregatedContent = contentSearched === true ? await contentAggregation.exec(): [];
			let aggregatedEvents = eventsSearched === true ? await eventAggregation.exec() : [];

			let eventIds = [];

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
				},
				projection: {
					id: true,
					connection_id: true,
					connection_id_string: true,
					contacts: true,
					contact_interaction_type: true,
					content: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					hydratedLocation: true,
					location: true,
					provider_id: true,
					provider_id_string: true,
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
					sort: sort
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
					connection_id: true,
					connection_id_string: true,
					contacts: true,
					contact_interaction_type: true,
					content: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					hydratedLocation: true,
					location: true,
					provider_id: true,
					provider_id_string: true,
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
					sort: sort
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


function MongoEvent(data) {
	this.connection_id = uuid(data.connection_id_string);
	this.contact_interaction_type = data.contact_interaction_type;
	this.context = data.context;
	this.datetime = new Date(data.datetime);
	this.identifier = data.identifier;
	//this.places = data.places;
	this.provider_id = uuid(data.provider_id_string);
	this.provider_name = data.provider_name.toLowerCase();
	this.source = data.source;
	this.tagMasks = data.tagMasks;
	this.type = data.type;
	this.updated = data.updated;
	this.user_id = data.user_id;

	if (data.contacts) {
		this.contacts = new Array(data.contacts.length);

		for (let i = 0; i < data.contacts.length; i++) {
			this.contacts[i] = data.contacts[i]._id;
		}
	}

	if (data.content) {
		this.content = new Array(data.content.length);

		for (let i = 0; i < data.content.length; i++) {
			this.content[i] = data.content[i]._id;
		}
	}

	if (data.things) {
		this.things = new Array(data.things.length);

		for (let i = 0; i < data.things.length; i++) {
			this.things[i] = data.things[i]._id;
		}
	}

	if (data.location) {
		this.location = data.location._id;
	}

	if (this.tagMasks == null) {
		delete this.tagMasks;
	}
}

EventTC.addResolver({
	name: 'eventBulkUpload',
	kind: 'mutation',
	type: [EventTC.getResolver('findOne').getType()],
	args: {
		events: 'String'
	},
	resolve: async function({source, args, context, info}) {
		let eventMap = {};
		let contactMap = {};
		let contentMap = {};
		let tagList = [];

		let bulkContacts = mongoose.connection.db.collection('contacts').initializeUnorderedBulkOp();
		let bulkContent = mongoose.connection.db.collection('content').initializeUnorderedBulkOp();
		let bulkEvents = mongoose.connection.db.collection('events').initializeUnorderedBulkOp();
		let bulkTags = mongoose.connection.db.collection('tags').initializeUnorderedBulkOp();

		let events = JSON.parse(args.events);

		let contactIdentifiers = [];
		let contentIdentifiers = [];
		let eventIdentifiers = [];

		_.each(events, function(event) {
			let contacts = event.contacts;

			_.each(contacts, function(contact) {
				if (contact.identifier) {
					if(contactMap[contact.identifier] == null) {
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

			let event = new MongoEvent(rawEvent);

			if (event.identifier) {
				if (eventMap[event.identifier] == null) {
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
	resolve: async function({source, args, context, info}) {
		let userResult;

		if (args.id == null || args.passcode == null) {
			throw new httpErrors(404);
		}

		let tagResult = await TagTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.id,
					share: 'public',
					passcode_string: args.passcode
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