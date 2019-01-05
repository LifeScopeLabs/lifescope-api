/* @flow */

import config from 'config';
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";
import {add as addTags, remove as removeTags} from './templates/tag';
import {ContactTC} from "./contacts";
import {TagTC} from "./tags";
import {UserTC} from "./users";

export const PeopleSchema = new mongoose.Schema(
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

		avatar_url: {
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

		created: {
			type: Date,
			default: Date.now,
			index: false
		},

		first_name: {
			type: String,
			index: false
		},

		middle_name: {
			type: String,
			index: false
		},

		last_name: {
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

		updated: {
			type: Date,
			index: false
		},

		user_id: {
			type: Buffer
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
		collection: 'people',
	}
);


export const People = mongoose.model('People', PeopleSchema);

export const PeopleTC = composeWithMongoose(People);


PeopleTC.addRelation('hydratedContacts', {
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
		}
	}
});


PeopleTC.addResolver({
	name: 'create',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		first_name: 'String',
		middle_name: 'String',
		last_name: 'String',
		contact_id_strings: ['String'],
		avatar_url: 'String'
	},
	resolve: async function({ source, args, context, info}) {
		let person = {
			_id: uuid(uuid()),
			contact_ids: [],
			created: moment().utc().toDate(),
			updated: moment().utc().toDate(),
			user_id: context.req.user._id
		};

		if (args.first_name) {
			person.first_name = args.first_name;
		}

		if (args.middle_name) {
			person.middle_name = args.middle_name;
		}

		if (args.last_name) {
			person.last_name = args.last_name;
		}

		let promise;

		if (args.contact_id_strings) {
			let contacts;

			let promises = _.map(args.contact_id_strings, function(contact_id_string) {
				return ContactTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: contact_id_string,
							user_id_string: context.req.user._id.toString('hex')
						}
					}
				})
					.then(function(contact) {
						if (contact == null) {
							return Promise.reject(httpErrors(400, 'Invalid Contact ID'));
						}
						else {
							return Promise.resolve(contact);
						}
					});
			});

			try {
				contacts = await Promise.all(promises);
			} catch(err) {
				throw err;
			}

			let contactIDs = _.map(contacts, function(contact) {
				return contact._id;
			});

			person.contact_ids = contactIDs;

			promise = Promise.resolve();
		}
		else {
			promise = Promise.resolve();
		}

		await promise;

		return await PeopleTC.getResolver('createOne').resolve({
			args: {
				record: person
			}
		});
	}
});


PeopleTC.addResolver({
	name: 'update',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		first_name: 'String',
		middle_name: 'String',
		last_name: 'String',
		contact_id_strings: ['String'],
		avatar_url: 'String'
	},
	resolve: async function({ source, args, context, info }) {
		let promise;
		let userIDString = context.req.user._id.toString('hex');

		let person = await PeopleTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: userIDString
				}
			}
		});

		if (person == null) {
			throw httpErrors(400, 'Invalid Person ID');
		}

		let update = {
			updated: moment().utc().toDate()
		};

		if (args.first_name && args.first_name != null) {
			update.first_name = args.first_name;
		}

		if (args.middle_name && args.middle_name != null) {
			update.middle_name = args.middle_name;
		}

		if (args.last_name && args.last_name != null) {
			update.last_name = args.last_name;
		}

		if (args.avatar_url != null) {
			update.avatar_url = args.avatar_url;
		}

		if (args.contact_id_strings) {
			let contacts;

			let promises = _.map(args.contact_id_strings, function(contact_id_string) {
				return ContactTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: contact_id_string,
							user_id_string: context.req.user._id.toString('hex')
						}
					}
				})
					.then(function(contact) {
						if (contact == null) {
							return Promise.reject(httpErrors(400, 'Invalid Contact ID'));
						}
						else {
							return Promise.resolve(contact);
						}
					});
			});

			try {
				contacts = await Promise.all(promises);
			} catch(err) {
				throw err;
			}

			let contactIDs = _.map(contacts, function(contact) {
				return contact._id;
			});

			update.contact_ids = contactIDs;

			promise = Promise.resolve();
		}
		else {
			promise = Promise.resolve();
		}

		await promise;

		return await PeopleTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: args.id,
					user_id_string: userIDString
				},
				record: update
			}
		});
	}
});

PeopleTC.addResolver({
	name: 'addTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await addTags(context.req, args, PeopleTC);
	}
});

PeopleTC.addResolver({
	name: 'removeTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await removeTags(context.req, args, PeopleTC);
	}
});


PeopleTC.addResolver({
	name: 'searchPeople',
	kind: 'mutation',
	type: PeopleTC.getResolver('findMany').getType(),
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

		// for (let key in specialSorts) {
		// 	if (!specialSorts.hasOwnProperty(key)) {
		// 		break;
		// 	}
		//
		// 	let field = specialSorts[key];
		//
		// 	if ((key === 'emptyQueryRelevance' && query.sortField === '_score' && query.q == null) || query.sortField === field.condition) {
		// 		specialSort = true;
		// 		sort = field.values;
		//
		// 		_.each(sort, function(val, name) {
		// 			sort[name] = query.sortOrder === 'asc' ? 1 : -1;
		// 		});
		// 	}
		// }

		if (specialSort === false) {
			sort = {
				[query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			}
		}

		if ((query.q != null && query.q.length > 0) || (query.filters != null && Object.keys(query.filters).length > 0)) {
			let contactAggregation = People.aggregate();

			let contactPreLookupMatch = {
				user_id: context.req.user._id
			};

			let contactPostLookupMatch = {};

			if (query.q != null && query.q.length > 0) {
				contactPreLookupMatch.$text = {
					$search: query.q
				};
			}

			if (_.has(query, 'filters.tagFilters') && query.filters.tagFilters.length > 0) {
				if (contactPreLookupMatch.$and == null) {
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

			if (_.has(query, 'filters.whatFilters') && query.filters.whatFilters.length > 0) {
				if (contactPreLookupMatch.$and == null) {
					contactPreLookupMatch.$and = [];
				}

				contactPreLookupMatch.$and.push({
					$or: query.filters.whatFilters
				});
			}

			if (_.has(query, 'filters.connectorFilters') && query.filters.connectorFilters.length > 0) {
				let lookupConnectorFilters = _.map(query.filters.connectorFilters, function(filter) {
					if (filter.connection_id_string) {
						return {
							connection_id: uuid(filter.connection_id_string)
						};
					}
					else if (filter.provider_id_string) {
						return {
							provider_id: uuid(filter.provider_id_string)
						};
					}
				});

				if (contactPostLookupMatch.$and == null) {
					contactPostLookupMatch.$and = [];
				}

				contactPostLookupMatch.$and.push({
					$or: lookupConnectorFilters
				});
			}

			contactAggregation
				.match(contactPreLookupMatch)
				.match(contactPostLookupMatch)
				.sort(sort)
				.skip(query.offset)
				.limit(query.limit)
				.project({
					_id: true
				});

			let aggregatedPeople = await contactAggregation.exec();

			let contactIds = [];

			if (aggregatedPeople.length > 0) {
				_.each(aggregatedPeople, function(contact) {
					contactIds.push(contact._id);
				});
			}

			let filter = {
				user_id_string: context.req.user._id.toString('hex'),
				_id: {
					$in: contactIds
				}
			};

			let contactMatches = await PeopleTC.getResolver('findMany').resolve({
				args: {
					filter: filter,
					sort: sort
				},
				projection: {
					id: true,
					connection_id: true,
					connection_id_string: true,
					provider_id: true,
					provider_id_string: true,
					avatar_url: true,
					handle: true,
					name: true,
					tagMasks: true
				}
			});

			let contactMatchCount = await PeopleTC.getResolver('count').resolve({
				args: {
					filter: filter,
					sort: sort
				}
			});

			documents = contactMatches;
			count = contactMatchCount;

		}
		else {
			let filter = {
				user_id_string: context.req.user._id.toString('hex')
			};

			if (query.sortField === 'name') {
				filter.name = {
					$nin: [null, '']
				};
			}

			if (query.sortField === 'handle') {
				filter.handle = {
					$nin: [null, '']
				};
			}

			let contactMatches = await PeopleTC.getResolver('findMany').resolve({
				args: {
					filter: filter,
					sort: sort,
					limit: query.limit,
					skip: query.offset
				},
				projection: {
					id: true,
					connection_id: true,
					connection_id_string: true,
					provider_id: true,
					provider_id_string: true,
					avatar_url: true,
					handle: true,
					name: true,
					tagMasks: true
				}
			});

			let contactMatchCount = await PeopleTC.getResolver('count').resolve({
				args: {
					filter: filter,
					sort: sort
				},
			});

			documents = contactMatches;
			count = contactMatchCount;
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

PeopleTC.addResolver({
	name: 'sharedTagSearch',
	kind: 'mutation',
	type: PeopleTC.getResolver('findMany').getType(),
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

		let searchResult = await PeopleTC.getResolver('searchPeople').resolve({
			args: {
				offset: args.offset,
				limit: args.limit,
				filters: JSON.stringify(filters),
				sortField: args.sortField,
				sortOrder: args.sortOrder
			},
			context: context,
		});

		return searchResult;
	}
});