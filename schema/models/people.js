/* global env */

import _ from 'lodash';
import config from 'config';
import httpErrors from 'http-errors';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import moment from 'moment';
import mongoose from 'mongoose';
import { graphql } from 'graphql-compose';

import uuid from "../../lib/util/uuid";
import { add as addTags, remove as removeTags } from './templates/tag';
import { ContactTC } from "./contacts";
import { TagTC } from "./tags";
import { UserTC } from "./users";

const AddressType = new graphql.GraphQLInputObjectType({
	name: 'addressType',
	fields: {
		street_address: {
			type: graphql.GraphQLString
		},
		street_address_2: {
			type: graphql.GraphQLString
		},
		city: {
			type: graphql.GraphQLString
		},
		region: {
			type: graphql.GraphQLString
		},
		country: {
			type: graphql.GraphQLString
		},
		postal_code: {
			type: graphql.GraphQLString
		},
	}
});

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

		address: {
			street_address: {
				type: String,
				index: false
			},

			street_address_2:{
				type: String,
				index: false
			},

			city: {
				type: String,
				index: false
			},

			region: {
				type: String,
				index: false
			},

			country: {
				type: String,
				index: false
			},

			postal_code: {
				type: String,
				index: false
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

		external_avatar_url: {
			type: String,
			index: false
		},

		hidden: {
			type: Boolean,
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

		notes: {
			type: String,
			index: false
		},

		self: Boolean,

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
		collection: 'people',
	}
);


export const People = mongoose.model('People', PeopleSchema);

export const PeopleTC = composeWithMongoose(People);


let specialSorts = {
	emptyQueryRelevance: {
		values: {
			first_name: -1
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
	name: 'hide',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await PeopleTC.getResolver('updateOne').resolve({
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

PeopleTC.addResolver({
	name: 'unhide',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await PeopleTC.getResolver('updateOne').resolve({
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


PeopleTC.addResolver({
	name: 'create',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		first_name: 'String',
		middle_name: 'String',
		last_name: 'String',
		contact_id_strings: ['String'],
		avatar_url: 'String',
		external_avatar_url: 'String',
		address: AddressType,
		notes: 'String'
	},
	resolve: async function({args, context}) {
		let userIDString = context.req.user._id.toString('hex');

		let person = {
			_id: uuid(uuid()),
			contact_ids: [],
			created: moment().utc().toDate(),
			updated: moment().utc().toDate(),
			self: false,
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

		if (args.avatar_url != null) {
			person.avatar_url = args.avatar_url;
		}

		if (args.external_avatar_url != null) {
			person.external_avatar_url = args.external_avatar_url;
		}

		if (args.address != null) {
			person.address = args.address;
		}

		if (args.notes != null) {
			person.notes = args.notes;
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
			}
			catch (err) {
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

		let personResult = await PeopleTC.getResolver('createOne').resolve({
			args: {
				record: person
			}
		});

		let promises = [];

		_.each(personResult.record.contact_ids, function(contactId) {
			promises.push(ContactTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: contactId.toString('hex'),
						user_id_string: userIDString
					},
					record: {
						people_id: personResult.record._id
					}
				}
			}))
		});

		await Promise.all(promises);
	}
});


PeopleTC.addResolver({
	name: 'delete',
	kind: 'mutation',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		try {
			let person = await PeopleTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: context.req.user._id.toString('hex')
					}
				}
			});

			let promises = _.map(person.contact_ids, function(contactId) {
				return contactId != null ? ContactTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							id: contactId.toString('hex'),
							user_id_string: context.req.user._id.toString('hex')
						},
						record: {
							people_id: null
						}
					}
				}) : Promise.resolve();
			});

			await Promise.all(promises);

			return PeopleTC.getResolver('removeOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: context.req.user._id.toString('hex')
					}
				}
			});
		}
		catch (err) {
			throw new Error(err);
		}
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
		avatar_url: 'String',
		external_avatar_url: 'String',
		address: AddressType,
		notes: 'String'
	},
	resolve: async function({args, context}) {
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

		if (args.external_avatar_url != null) {
			update.external_avatar_url = args.external_avatar_url;
		}

		if (args.address != null) {
			update.address = args.address;
		}

		if (args.notes != null) {
			update.notes = args.notes;
		}

		if (args.contact_id_strings) {
			let contacts;

			let person = await PeopleTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: args.id,
						user_id_string: userIDString
					}
				}
			});

			let removed = person.contact_id_strings;

			let promises = _.map(args.contact_id_strings, function(contact_id_string) {
				return ContactTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: contact_id_string,
							user_id_string: userIDString
						}
					}
				})
					.then(function(contact) {
						if (contact == null) {
							_.remove(removed, contact_id_string);

							return Promise.resolve(null);
						}
						else {
							_.remove(removed, contact.id);

							return Promise.resolve(contact);
						}
					});
			});

			try {
				contacts = await Promise.all(promises);
			}
			catch (err) {
				throw err;
			}

			promises = [];

			let contactIDs = [];

			_.each(contacts, function(contact) {
				if (contact != null) {
					contactIDs.push(contact._id);

					_.pull(removed, contact.id);

					promises.push(ContactTC.getResolver('updateOne').resolve({
						args: {
							filter: {
								id: contact.id,
								user_id_string: userIDString
							},
							record: {
								people_id: uuid(args.id)
							}
						}
					}));
				}
			});

			_.each(removed, function(contactIdString) {
				promises.push(ContactTC.getResolver('updateOne').resolve({
					args: {
						filter: {
							id: contactIdString,
							user_id_string: userIDString
						},
						record: {
							people_id: null
						}
					}
				}));
			});

			update.contact_ids = contactIDs;

			promise = Promise.all(promises);
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
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
		return await addTags(context.req, args, PeopleTC);
	}
});

PeopleTC.addResolver({
	name: 'removeTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
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
	resolve: async function({args, context}) {
		let /*count,*/ documents;
		let validate = env.validate;

		let filters = args.filters ? JSON.parse(args.filters) : {};

		let query = {
			filters: filters,
			limit: args.limit,
			offset: args.offset,
			q: args.q,
			sortField: args.sortField,
			sortOrder: args.sortOrder
		};

		try {
			await validate('#/requests/search', query);
		}
		catch (err) {
			throw new httpErrors(400, 'Query was invalid')
		}

		if (query.limit > config.objectMaxLimit) {
			query.limit = config.objectMaxLimit;
		}

		let sort;

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
					sort[name] = query.sortOrder === 'asc' ? 1 : -1;
				});
			}
		}

		if (specialSort === false) {
			sort = {
				[query.sortField]: query.sortOrder === 'asc' ? 1 : -1
			}
		}

		if (query.q != null && query.q.length > 0) {
			_.each(stopwords, function(stopword) {
				let regexp = new RegExp('^' + stopword + ' | ' + stopword + ' | ' + stopword + '$', 'g');

				query.q = query.q.replace(regexp, '');
			});
		}

		if ((query.q != null && query.q.length > 0) || (query.filters != null && Object.keys(query.filters).length > 0)) {
			// let peopleAggregation = People.aggregate();

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

			let $peopleContactLookup = {
				from: 'contacts',
				localField: 'contact_ids',
				foreignField: '_id',
				as: 'contacts'
			};

			let peoplePostLookupMatch = {};
			let peopleSearchBeta = {};

			if (query.q != null && query.q.length > 0) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below is the old text search using Mongo's $text indexing.
					It's been replaced by the full text search that's included in Mongo Atlas as of 4.2.
					If this code is being run on a version of Mongo that doesn't support full text search, uncomment
					the following section and uncomment some more code below that's also headed by the all-caps line above.
				 */
				// peoplePreLookupMatch.$text = {
				// 	$search: query.q
				// };

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
			}

			if (_.has(query, 'filters.tagFilters') && query.filters.tagFilters.length > 0) {
				if (peoplePreLookupMatch.$and == null) {
					peoplePreLookupMatch.$and = [];
				}

				peoplePreLookupMatch.$and.push({
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

			if (_.has(query, 'filters.whoFilters') && query.filters.whoFilters.length > 0) {
				let peopleFilters = [];

				_.each(query.filters.whoFilters, function(whoFilter) {
					if (whoFilter.text) {
						if (whoFilter.text.operand) {
							peopleFilters.push({
								$and: [
									whoFilter.text.operand,
									{
										$or: [
											{
												'contacts.name': whoFilter.text.text
											},
											{
												'contacts.handle': whoFilter.text.text
											},
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
							peopleFilters.push({
								$or: [
									{
										'contacts.name': whoFilter.text.text
									},
									{
										'contacts.handle': whoFilter.text.text
									},
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

				if (peopleFilters.length > 0) {
					if (peoplePostLookupMatch.$and == null) {
						peoplePostLookupMatch.$and = [];
					}

					peoplePostLookupMatch.$and.push({
						$or: peopleFilters
					});
				}
			}

			let peopleAggregation;

			// peopleAggregation
			// 	.match(peoplePreLookupMatch)
			// 	.unwind('$contact_ids')
			// 	.lookup($peopleContactLookup)
			// 	.unwind({
			// 		path: '$contacts',
			// 		preserveNullAndEmptyArrays: true
			// 	})
			// 	.match(peoplePostLookupMatch)
			// 	.sort(sort)
			// 	.skip(query.offset)
			// 	.limit(query.limit)
			// 	.project({
			// 		_id: true
			// 	});

			let pipeline = [];

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
					$lookup: $peopleContactLookup
				},
				{
					$unwind: {
						path: '$contacts',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match: peoplePostLookupMatch
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

			peopleAggregation = People.collection.aggregate(pipeline);

			let aggregatedPeople = await peopleAggregation.toArray();

			let peopleIds = [];
			let peopleIdStrings = [];

			if (aggregatedPeople.length > 0) {
				_.each(aggregatedPeople, function(person) {
					peopleIds.push(person._id);
					peopleIdStrings.push(person._id.toString('hex'));
				});
			}

			let filter = {
				user_id_string: context.req.user._id.toString('hex'),
				_id: {
					$in: peopleIds
				}
			};

			let peopleMatches = await PeopleTC.getResolver('findMany').resolve({
				args: {
					filter: filter,
					sort: sort
				}
			});

			peopleMatches.sort(function(a, b) {
				return peopleIdStrings.indexOf(a._id.toString('hex')) - peopleIdStrings.indexOf(b._id.toString('hex'));
			});

			// let peopleMatchCount = await PeopleTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: filter,
			// 		sort: sort
			// 	}
			// });

			documents = peopleMatches;
			// count = peopleMatchCount;

		}
		else {
			let filter = {
				user_id_string: context.req.user._id.toString('hex')
			};

			if (query.sortField === 'first_name') {
				filter.first_name = {
					$nin: [null, '']
				};
			}

			if (query.sortField === 'middle_name') {
				filter.middle_name = {
					$nin: [null, '']
				};
			}

			if (query.sortField === 'last_name') {
				filter.last_name = {
					$nin: [null, '']
				};
			}

			let peopleMatches = await PeopleTC.getResolver('findMany').resolve({
				args: {
					filter: filter,
					sort: sort,
					limit: query.limit,
					skip: query.offset
				}
			});

			// let peopleMatchCount = await PeopleTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: filter,
			// 		sort: sort
			// 	},
			// });

			documents = peopleMatches;
			// count = peopleMatchCount;
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

PeopleTC.addResolver({
	name: 'sharedSelfPerson',
	kind: 'query',
	type: PeopleTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		passcode: 'String!'
	},
	resolve: async function({args}) {
		let personResult;

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
			personResult = await PeopleTC.getResolver('findOne').resolve({
				args: {
					filter: {
						self: true,
						user_id_string: tagResult.user_id.toString('hex')
					}
				}
			});

			if (personResult == null) {
				throw new httpErrors(404);
			}

			let returned = _.pick(personResult, ['first_name', 'middle_name', 'last_name', 'avatar_url', 'external_avatar_url']);

			return Promise.resolve(returned);
		}
		else {
			throw new httpErrors(404);
		}
	}
});

PeopleTC.setResolver('findMany', PeopleTC.getResolver('findMany')
	.addFilterArg({
		name: 'self',
		type: 'Boolean',
		description: 'Filter by self being true or false',
		query: function(query, value) {
			if (value != null) {
				query.self = value === true ? true : {
					$ne: true
				};
			}
		}
	})
	.addSortArg({
		name: 'first_name',
		description: 'Alphabetical sort on first_name',
		value: {
			first_name: 1
		}
	})
	.addSortArg({
		name: 'middle_name',
		description: 'Alphabetical sort on middle_name',
		value: {
			middle_name: 1
		}
	})
	.addSortArg({
		name: 'last_name',
		description: 'Alphabetical sort on last_name',
		value: {
			last_name: 1
		}
	})
);

PeopleTC.setResolver('findOne', PeopleTC.getResolver('findOne')
	.addFilterArg({
		name: 'self',
		type: 'Boolean',
		description: 'Filter by self being true or false',
		query: function(query, value) {
			if (value != null) {
				query.self = value === true ? true : {
					$ne: true
				};
			}
		}
	})
);
PeopleTC.setResolver('count', PeopleTC.getResolver('count')
	.addFilterArg({
		name: 'self',
		type: 'Boolean',
		description: 'Filter by self being true or false',
		query: function(query, value) {
			if (value != null) {
				query.self = value === true ? true : {
					$ne: true
				}
			}
		}
	})
);