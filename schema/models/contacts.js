/* @flow */

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import mongoose from 'mongoose';

import uuid from "../../lib/util/uuid";
import {add as addTags, remove as removeTags} from './templates/tag';
import {TagTC} from "./tags";

export const ContactsSchema = new mongoose.Schema(
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

		avatar_url: {
			type: String,
			index: false
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

		created: {
			type: Date,
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
				type: [String],
				index: false
			},
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
		collection: 'contacts',
	}
);


export const Contacts = mongoose.model('Contacts', ContactsSchema);

export const ContactTC = composeWithMongoose(Contacts);



ContactTC.addResolver({
	name: 'addContactTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		await addTags(context.req, args, ContactTC);
	}
});

ContactTC.addResolver({
	name: 'removeContactTags',
	kind: 'mutation',
	type: TagTC.getResolver('findOne').getType(),
	args: {
		tags: ['String']
	},
	resolve: async function({source, args, context, info}) {
		await removeTags(context.req, args, ContactTC);
	}
});