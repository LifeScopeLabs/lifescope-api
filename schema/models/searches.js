/* @flow */

// TODO: FIXXX
// TODO: rename relative-number and since-exactly to get rid of -
import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import crypto from 'crypto';
import moment from 'moment';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";
import sortDictionary from '../../lib/util/sort-dictionary';

export const SearchesSchema = new mongoose.Schema(
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

		count: {
			type: Number,
			index: false
		},

		favorited: {
			type: Boolean,
			index: false
		},

		filters: {
			data: {
				type: JSON
			},
			name: {
				type: String,
				index: false
			},
			type: {
				type: String,
				index: false
			},
		},

		hash: {
			type: String,
			index: false
		},

		icon: {
			type: String,
			index: false
		},

		icon_color: {
			type: String,
			index: false
		},

		last_run: {
			type: Date,
			index: false
		},

		name: {
			type: String,
			index: false
		},

		query: {
			type: String,
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
		collection: 'searches',
	}
);

export const Searches = mongoose.model('Searches', SearchesSchema);

export const SearchTC = composeWithMongoose(Searches);


SearchTC.addResolver({
	name: 'upsertSearch',
	kind: 'mutation',
	type: SearchTC.getResolver('findOne').getType(),
	args: {
		filters: 'String',
		query: 'String',
		favorited: 'Boolean',
		icon: 'String',
		icon_color: 'String',
		name: 'String'
	},
	resolve: async function({source, args, context, info}) {
		let filters = args.filters;
		let req = context.req;

		if (!filters) {
			filters = '[]';
		}

		filters = JSON.parse(filters);

		let unnamedFilters = new Array(filters.length);

		_.map(filters, function(filter, i) {
			unnamedFilters[i] = _.omit(filter, 'name');
		});

		let hashObj = {
			filters: unnamedFilters
		};

		if (args.query != null) {
			hashObj.query = args.query;
		}

		let sorted = sortDictionary(hashObj);
		let hash = crypto.createHash('sha512').update(sorted).digest('hex');

		let current = await SearchTC.getResolver('findOne').resolve({
			args: {
				filter: {
					hash: hash,
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		let result;

		if (current) {
			result = await SearchTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						hash: hash,
						user_id_string: req.user._id.toString('hex')
					},
					record: {
						filters: filters,
						last_run: moment.utc().toDate(),
						count: current.count + 1
					}
				}
			});
		}
		else {
			result = await SearchTC.getResolver('createOne').resolve({
				args: {
					record: {
						id: uuid(),
						hash: hash,
						filters: filters,
						last_run: moment.utc().toDate(),
						count: 1,
						favorited: args.favorited,
						icon: args.icon,
						icon_color: args.icon_color,
						query: args.query,
						name: args.name,
						user_id_string: req.user._id.toString('hex')
					}
				}
			})
		}

		console.log(result.record);

		return result.record;
	}
});




SearchTC.addResolver({
	name: 'findSearch',
	kind: 'mutation',
	type: SearchTC.getResolver('findOne').getType(),
	args: {
		filters: 'String',
		query: 'String',
		favorited: 'Boolean',
		icon: 'String',
		icon_color: 'String',
		name: 'String'
	},
	resolve: async function({source, args, context, info}) {
		let filters = args.filters;
		let req = context.req;

		if (!filters) {
			filters = '[]';
		}

		filters = JSON.parse(filters);

		let unnamedFilters = new Array(filters.length);

		_.map(filters, function(filter, i) {
			unnamedFilters[i] = _.omit(filter, 'name');
		});

		let hashObj = {
			filters: unnamedFilters
		};

		if (args.query != null) {
			hashObj.query = args.query;
		}

		let sorted = sortDictionary(hashObj);
		let hash = crypto.createHash('sha512').update(sorted).digest('hex');

		let result = await SearchTC.getResolver('findOne').resolve({
			args: {
				filter: {
					hash: hash,
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		return result? result.record: null;
	}
});

SearchTC.setResolver('updateOne', SearchTC.getResolver('updateOne').wrapResolve(next => rp => {
	rp.args.record.user_id_string = rp.context.req.user._id.toString('hex');
	rp.args.record.last_run = moment.utc().toDate()
}));