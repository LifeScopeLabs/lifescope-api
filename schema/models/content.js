/* global env */

import _ from 'lodash';
import config from 'config';
import httpErrors from 'http-errors';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";
import { add as addTags, remove as removeTags } from './templates/tag';
import { TagTC } from "./tags";
import { UserTC } from "./users";

export const ContentSchema = new mongoose.Schema(
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

		created: {
			type: Date,
			default: Date.now,
			index: false
		},

		embed_content: {
			type: String,
			index: false
		},

		embed_format: {
			type: String,
			index: false
		},

		embed_thumbnail: {
			type: String,
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

		mimetype: {
			type: String,
			index: false
		},

		price: Number,

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

		text: {
			type: String,
			index: false
		},

		title: {
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

		url: {
			type: String,
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
		collection: 'content',
	}
);

export const Content = mongoose.model('Content', ContentSchema);

export const ContentTC = composeWithMongoose(Content);


let specialSorts = {
	emptyQueryRelevance: {
		values: {
			title: -1
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


ContentTC.addResolver({
	name: 'addTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
		return await addTags(context.req, args, ContentTC);
	}
});

ContentTC.addResolver({
	name: 'removeTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		id: 'String!',
		tags: ['String']
	},
	resolve: async function({args, context}) {
		return await removeTags(context.req, args, ContentTC);
	}
});

ContentTC.addResolver({
	name: 'hide',
	kind: 'mutation',
	type: ContentTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await ContentTC.getResolver('updateOne').resolve({
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

ContentTC.addResolver({
	name: 'unhide',
	kind: 'mutation',
	type: ContentTC.getResolver('findOne').getType(),
	args: {
		id: 'String!'
	},
	resolve: async function({args, context}) {
		return await ContentTC.getResolver('updateOne').resolve({
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

ContentTC.addResolver({
	name: 'findByIdentifier',
	kind: 'query',
	type: ContentTC.getResolver('findOne').getType(),
	args: {
		identifier: 'String'
	},
	resolve: async function({args, context}) {
		return await ContentTC.getResolver('findOne').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex'),
					identifier: args.identifier
				}
			}
		});
	}
});


ContentTC.addResolver({
	name: 'searchContent',
	kind: 'mutation',
	type: ContentTC.getResolver('findMany').getType(),
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

		let sort;

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

			//FIXME This is a hack to prevent things with :// triggering extremely long Mongo queries.
			//The root cause of why things like URLs take so long to search for should be researched and
			//a better solution implemented.
			query.q = query.q.replace(/:\/+/, ':/');
		}

		if ((query.q != null && query.q.length > 0) || (query.filters != null && Object.keys(query.filters).length > 0)) {
			// let contentAggregation = Content.aggregate();

			let contentPreLookupMatch = {
				user_id: context.req.user._id
			};

			let contentPostLookupMatch = {};
			let contentSearchBeta = {};

			if (query.q != null && query.q.length > 0) {
				/*
					NOTE ON MONGO FULL TEXT SEARCH

					The code commented below is the old text search using Mongo's $text indexing.
					It's been replaced by the full text search that's included in Mongo Atlas as of 4.2.
					If this code is being run on a version of Mongo that doesn't support full text search, uncomment
					the following section and uncomment some more code below that's also headed by the all-caps line above.
				 */
				// contentPreLookupMatch.$text = {
				// 	$search: query.q
				// };

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
			}

			if (_.has(query, 'filters.tagFilters') && query.filters.tagFilters.length > 0) {
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

			if (_.has(query, 'filters.whatFilters') && query.filters.whatFilters.length > 0) {
				if (contentPreLookupMatch.$and == null) {
					contentPreLookupMatch.$and = [];
				}

				contentPreLookupMatch.$and.push({
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

				if (contentPostLookupMatch.$and == null) {
					contentPostLookupMatch.$and = [];
				}

				contentPostLookupMatch.$and.push({
					$or: lookupConnectorFilters
				});
			}

			let contentAggregation;

			// contentAggregation
			// 	.match(contentPreLookupMatch)
			// 	.match(contentPostLookupMatch)
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

			if (Object.keys(contentSearchBeta).length > 0) {
				pipeline.push({
					$searchBeta: contentSearchBeta,
				});
			}

			pipeline.push({
					$match: contentPreLookupMatch
				},
				{
					$match: contentPostLookupMatch
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

			contentAggregation = Content.collection.aggregate(pipeline, options);

			let aggregatedContent = await contentAggregation.toArray();

			let contentIds = [];
			let contentIdStrings = [];

			if (aggregatedContent.length > 0) {
				_.each(aggregatedContent, function(content) {
					contentIds.push(content._id);
					contentIdStrings.push(content._id.toString('hex'));
				});
			}

			let filter = {
				user_id_string: context.req.user._id.toString('hex'),
				_id: {
					$in: contentIds
				}
			};

			if (query.sortField === 'title') {
				filter.title = {
					$nin: [null, ''],
				}
			}

			let contentMatches = await ContentTC.getResolver('findMany').resolve({
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
					embed_content: true,
					embed_format: true,
					embed_thumbnail: true,
					mimetype: true,
					tagMasks: true,
					text: true,
					title: true,
					type: true,
					url: true
				}
			});

			contentMatches.sort(function(a, b) {
				return contentIdStrings.indexOf(a._id.toString('hex')) - contentIdStrings.indexOf(b._id.toString('hex'));
			});

			// let contentMatchCount = await ContentTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: filter,
			// 		sort: sort
			// 	}
			// });

			documents = contentMatches;
			// count = contentMatchCount;

		}
		else {
			let filter = {
				user_id_string: context.req.user._id.toString('hex')
			};

			if (query.sortField === 'title') {
				filter.title = {
					$nin: [null, ''],
				}
			}

			let contentMatches = await ContentTC.getResolver('findMany').resolve({
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
					embed_content: true,
					embed_format: true,
					embed_thumbnail: true,
					mimetype: true,
					tagMasks: true,
					text: true,
					title: true,
					type: true,
					url: true
				}
			});

			// let contentMatchCount = await ContentTC.getResolver('count').resolve({
			// 	args: {
			// 		filter: {
			// 			user_id_string: context.req.user._id.toString('hex')
			// 		},
			// 		sort: sort,
			// 		limit: query.limit,
			// 		skip: query.offset
			// 	},
			// });

			documents = contentMatches;
			// count = contentMatchCount;
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

ContentTC.addResolver({
	name: 'sharedTagSearch',
	kind: 'mutation',
	type: ContentTC.getResolver('findMany').getType(),
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

		let searchResult = await ContentTC.getResolver('searchContent').resolve({
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