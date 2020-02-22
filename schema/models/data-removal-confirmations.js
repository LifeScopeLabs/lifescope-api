/* @flow */

import _ from 'lodash';
import graphqlComposeMongoose from 'graphql-compose-mongoose';
import gqlCompose from 'graphql-compose';
import mongoose from 'mongoose';

import uuid from '../../lib/util/uuid.js';
import { ConnectionTC } from './connections.js';

const { composeWithMongoose } = graphqlComposeMongoose;
const { graphql } = gqlCompose;


let checkType = new graphql.GraphQLObjectType({
	name: 'check',
	fields: {
		noRecord: {
			type: graphql.GraphQLBoolean
		},
		providerName: {
			type: graphql.GraphQLString
		},
		success: {
			type: graphql.GraphQLBoolean
		}
	}
});


export const DataRemovalConfirmationsSchema = new mongoose.Schema(
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

		confirmation_code: {
			type: Buffer
		},

		confirmation_code_string: {
			type: String,
			get: function() {
				if (this.confirmation_code) {
					return this.confirmation_code.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.confirmation_code_string) {
					this._conditions.confirmation_code = uuid(val);

					delete this._conditions.confirmation_code_string;
				}

				this.confirmation_code = uuid(val);
			}
		},

		connection_id: {
			type: Buffer
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

		provider_name: {
			type: String
		}
	},
	{
		collection: 'data_removal',
	}
);

export const DataRemovalConfirmations = mongoose.model('DataRemovalConfirmations', DataRemovalConfirmationsSchema);

export const DataRemovalConfirmationsTC = composeWithMongoose(DataRemovalConfirmations);

DataRemovalConfirmationsTC.addResolver({
	name: 'check',
	kind: 'query',
	type: checkType,
	args: {
		confirmation_code: 'String!'
	},
	resolve: async function({args}) {
		let returned = {};
		let confirmationCode = args.confirmation_code;

		let confirmation = await DataRemovalConfirmationsTC.getResolver('findOne').resolve({
			args: {
				filter: {
					confirmation_code_string: confirmationCode
				}
			}
		});

		await new Promise(async function(resolve) {
			if (confirmation == null) {
				returned.noRecord = true;

				resolve();
			}
			else {
				let connection = await ConnectionTC.getResolver('findOne').resolve({
					args: {
						filter: {
							id: confirmation.connection_id.toString('hex')
						}
					}
				});

				returned.success = connection == null;
				returned.providerName = confirmation.provider_name;

				resolve();
			}
		});

		return returned;
	}
});