/* @flow */

import _ from 'lodash';
import config from 'config';
import httpErrors from 'http-errors';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";
import {add as addTags, remove as removeTags} from './templates/tag';
import {ConnectionTC} from "./connections";
import {TagTC} from "./tags";
import {UserTC} from "./users";
import {PeopleTC} from "./people";

export const ContactsSchema = new mongoose.Schema(
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

		created: {
			type: Date,
			default: Date.now,
			index: false
		},

		handle: {
			type: String,
			index: false
		},

		identifier: {
			type: String,
			index: false
		},

		name: {
			type: String,
			index: false
		},

		people_id: {
			type: Buffer
		},

		people_id_string: {
			type: String,
			get: function() {
				return this.people_id ? this.people_id.toString('hex') : null;
			},
			set: function(val) {
				if (val && this._conditions && this._conditions.people_id_string) {
					this._conditions.people_id = uuid(val);

					delete this._conditions.people_id_string;
				}

				this.people_id = uuid(val);
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

		remote_id: {
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
			type: Buffer,
			//index: false
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
		collection: 'contacts',
	}
);


export const Contacts = mongoose.model('Contacts', ContactsSchema);

export const ContactTC = composeWithMongoose(Contacts);


ContactTC.addRelation('hydratedPerson', {
	resolver: () => PeopleTC.getResolver('findOne'),
	prepareArgs: {
		filter: function(source) {
			let returned = {
				id: {
					$in: []
				}
			};

			if (source.people_id) {
				returned.id.$in.push(source.people_id.toString('hex'));
			}

			return returned;
		}
	}
});

ContactTC.addRelation('hydratedConnection', {
	resolver: () => ConnectionTC.getResolver('findOne'),
	prepareArgs: {
		filter: function(source) {
			let returned = {
				id: {
					$in: []
				}
			};

			if (source.connection_id) {
				returned.id.$in.push(source.connection_id.toString('hex'));
			}

			return returned;
		}
	}
});



ContactTC.addResolver({
	name: 'addTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await addTags(context.req, args, ContactTC);
	}
});

ContactTC.addResolver({
	name: 'removeTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String',
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		return await removeTags(context.req, args, ContactTC);
	}
});

ContactTC.addResolver({
	name: 'unpersonedContacts',
	kind: 'query',
	type: ContactTC.getResolver('findMany').getType(),
	args: {
		q: 'String'
	},
	resolve: async function({ source, args, context, info}) {
		let results = await mongoose.connection.db.collection('contacts').find({
			$text: {
				$search: args.q || ''
			},
			$or: [
				{
					people_id: {
						$exists: false
					}
				},
				{
					people_id: null
				}
			],
			user_id: context.req.user._id
		}).toArray();

		_.each(results, function(contact) {
			contact.id = contact._id.toString('hex');
			contact._id = contact._id.buffer;
			contact.user_id_string = contact.user_id.toString('hex');
			contact.user_id = contact.user_id.buffer;
			contact.connection_id_string = contact.connection_id.toString('hex');
			contact.connection_id = contact.connection_id.buffer;
			contact.provider_id_string = contact.provider_id.toString('hex');
			contact.provider_id = contact.provider_id.buffer;
		});

		return results;
	}
});


ContactTC.addResolver({
	name: 'searchContacts',
	kind: 'mutation',
	type: ContactTC.getResolver('findMany').getType(),
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
			let contactAggregation = Contacts.aggregate();

			let contactPreLookupMatch = {
				user_id: context.req.user._id
			};

			let $contactPersonLookup = {
				from: 'people',
				localField: 'people_id',
				foreignField: '_id',
				as: 'person'
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

			if (_.has(query, 'filters.whoFilters') && query.filters.whoFilters.length > 0) {
				let contactFilters = [];

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
											},
											{
												'person.first_name': whoFilter.text.text
											},
											{
												'person.middle_name': whoFilter.text.text
											},
											{
												'person.last_name': whoFilter.text.text
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
									},
									{
										'person.first_name': whoFilter.text.text
									},
									{
										'person.middle_name': whoFilter.text.text
									},
									{
										'person.last_name': whoFilter.text.text
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
									'person._id': uuid(whoFilter.person_id_string.person_id_string)
								});
							}

							contactFilters.push(filter);
						}
						else {
							contactFilters.push({ 'person._id': uuid(whoFilter.person_id_string.person_id_string) });
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
				}
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
				.lookup($contactPersonLookup)
				.unwind({
					path: '$people',
					preserveNullAndEmptyArrays: true
				})
				.match(contactPostLookupMatch)
				.sort(sort)
				.skip(query.offset)
				.limit(query.limit)
				.project({
					_id: true
				});

			let aggregatedContacts = await contactAggregation.exec();

			let contactIds = [];

			if (aggregatedContacts.length > 0) {
				_.each(aggregatedContacts, function(contact) {
					contactIds.push(contact._id);
				});
			}

			let filter = {
				user_id_string: context.req.user._id.toString('hex'),
				_id: {
					$in: contactIds
				}
			};

			let contactMatches = await ContactTC.getResolver('findMany').resolve({
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

			let contactMatchCount = await ContactTC.getResolver('count').resolve({
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

			let contactMatches = await ContactTC.getResolver('findMany').resolve({
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

			let contactMatchCount = await ContactTC.getResolver('count').resolve({
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

ContactTC.addResolver({
	name: 'sharedTagSearch',
	kind: 'mutation',
	type: ContactTC.getResolver('findMany').getType(),
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

		let searchResult = await ContactTC.getResolver('searchContacts').resolve({
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