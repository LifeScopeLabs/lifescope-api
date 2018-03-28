/* @flow */

import _ from 'lodash';
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

import uuid from "../../lib/util/uuid";

import {ContactTC} from './contacts';
import {ContentTC} from './content';
import {UserTC} from "./users";
import {SessionTC} from "./sessions";
import deleteConnection from "../../lib/util/delete-connection";
import {ConnectionTC} from "./connections";

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

EventTC.addResolver({
	name: 'searchEvents',
	kind: 'mutation',
	type: EventTC.getResolver('findMany').getType(),
	args: {
		filters: mongoose.Schema.Types.Mixed
	},
	resolve: async ({source, args, context, info}) => {
		let count, documents;
		let validate = env.validate;

		let filters = args.filters;
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
			}
		}

		if (specialSort === false) {
			sort = {
				[query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			}
		}

		if (query.q != null || (query.filters != null && Object.keys(query.filters).length > 0)) {
			let contactOptions = {};
			let contentOptions = {};
			let eventOptions = {};

			if (query.filters.hasOwnProperty('whoFilters') && query.filters.whoFilters.length > 0) {
				if (!contactOptions.hasOwnProperty('$and')) {
					contactOptions.$and = [];
				}

				contactOptions.$and.push({
					$or: query.filters.whoFilters
				});
			}

			if (query.filters.hasOwnProperty('whatFilters') && query.filters.whatFilters.length > 0) {
				if (!contentOptions.hasOwnProperty('$and')) {
					contentOptions.$and = [];
				}

				contentOptions.$and.push({
					$or: query.filters.whatFilters
				});
			}

			if (query.filters.hasOwnProperty('whenFilters') && query.filters.whenFilters.length > 0) {
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

			if (query.filters.hasOwnProperty('whereFilters') && query.filters.whereFilters.length > 0) {
				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				eventOptions.$and.push({
					$or: query.filters.whereFilters
				});
			}

			if (query.filters.hasOwnProperty('connectorFilters') && query.filters.connectorFilters.length > 0) {
				if (!eventOptions.hasOwnProperty('$and')) {
					eventOptions.$and = [];
				}

				eventOptions.$and.push({
					$or: query.filters.connectorFilters
				});
			}

			if (query.filters.hasOwnProperty('tagFilters') && query.filters.tagFilters.length > 0) {
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

			if (query.q != null) {
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

			let contactResults = await ContactTC.getResolver('findMany').resolve({
				args: {
					filter: contactOptions
				}
			});

			let contentResults = await ContactTC.getResolver('findMany').resolve({
				args: {
					filter: contentOptions
				}
			});

			let eventResults = await ContactTC.getResolver('findMany').resolve({
				args: {
					filter: eventOptions
				}
			});

			let contactIds = _.map(contactResults, function(result) {
				return result._id.toString('hex');
			});

			let contentIds = _.map(contentResults, function(result) {
				return result._id.toString('hex');
			});

			let eventIds = _.map(eventResults, function(result) {
				return result._id.toString('hex');
			});

			let eventMatches = EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(eventIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
				projection: {
					id: true,
					connection_id_string: true,
					contact_interaction_type: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					type: true,
					updated: true
				}
			});

			let contactMatches = EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(contactIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
				projection: {
					id: true,
					connection_id_string: true,
					contact_interaction_type: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					type: true,
					updated: true
				}
			});

			let contentMatches = EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(contentIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
				projection: {
					id: true,
					connection_id_string: true,
					contact_interaction_type: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					type: true,
					updated: true
				}
			});

			let eventMatchCount = EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(eventIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
			});

			let contactMatchCount = EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(contactIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
			});

			let contentMatchCount = EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(contentIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
			});

			documents = _.union(eventMatches, contactMatches, contentMatches);
			count = eventMatchCount + contactMatchCount + contentMatchCount;
		}
		else {
			let eventMatches = EventTC.getResolver('findMany').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex')
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				},
				projection: {
					id: true,
					connection_id_string: true,
					contact_interaction_type: true,
					context: true,
					created: true,
					datetime: true,
					hydratedContacts: true,
					hydratedContent: true,
					provider_name: true,
					source: true,
					type: true,
					updated: true
				}
			});

			let eventMatchCount = EventTC.getResolver('count').resolve({
				args: {
					filter: {
						user_id_string: req.user._id.toString('hex'),
						id: {
							$in: _.map(eventIds, function(id) {
								return id.toString('hex')
							})
						}
					}
				},
				opts: {
					sort: sort,
					limit: query.limit,
					offset: query.offset
				}
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