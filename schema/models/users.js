/* @flow */

import _ from 'lodash';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';
import { graphql } from 'graphql-compose';

import deleteConnection from '../../lib/util/delete-connection';
import uuid from '../../lib/util/uuid';
import { ContactTC } from './contacts';
import { ConnectionTC } from './connections';
import { ContentTC } from './content';
import { EmailUpdateRequestTC } from './email-update-request';
import { EventTC } from './events';
import { Locations, LocationTC } from './locations';
import { SearchTC } from './searches';
import { SessionTC } from './sessions';
import { TagTC } from './tags';
import { OAuthAppTC } from './oauth-apps';
import { OAuthTokenTC } from './oauth-tokens';
import { OAuthTokenSessionTC } from './oauth-token-sessions';
import { PeopleTC } from './people';
import { LocationFileTC } from './location-files';
import EmailClient from '../../lib/extensions/mandrill/email-client';

let emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

let tutorials = [
	'connections',
	'explorer',
	'home',
];

let basicType = new graphql.GraphQLObjectType({
	name: 'userBasic',
	fields: {
		id: {
			type: graphql.GraphQLString
		}
	}
});

let allCountType = new graphql.GraphQLObjectType({
	name: 'allCounts',
	fields: {
		connectionCount: {
			type: graphql.GraphQLInt
		},

		contactCount: {
			type: graphql.GraphQLInt
		},

		contentCount: {
			type: graphql.GraphQLInt
		},

		eventCount: {
			type: graphql.GraphQLInt
		},

		locationCount: {
			type: graphql.GraphQLInt
		},

		peopleCount: {
			type: graphql.GraphQLInt
		},

		searchCount: {
			type: graphql.GraphQLInt
		},

		favoriteSearchCount: {
			type: graphql.GraphQLInt
		},

		tagCount: {
			type: graphql.GraphQLInt
		},

		sharedTagCount: {
			type: graphql.GraphQLInt
		},
	}
});


export const UserSchema = new mongoose.Schema(
	{
		meta: {
			type: Object
		},

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

		api_key: {
			type: Buffer
		},

		api_key_string: {
			type: String,
			get: function() {
				if (this.api_key) {
					return this.api_key.toString('hex');
				}
			},
			set: function(val) {
				if (this._conditions && this._conditions.api_key_string) {
					if (this._conditions.api_key_string.hasOwnProperty('$in')) {
						this._conditions.api_key = {
							$in: _.map(this._conditions.api_key_string.$in, function(item) {
								return uuid(item);
							})
						};
					}
					else {
						this._conditions.api_key = uuid(val);
					}

					delete this._conditions.api_key_string;
				}

				if (val.hasOwnProperty('$in')) {
					this.api_key = {
						$in: _.map(val.$in, function(item) {
							return uuid(item);
						})
					};

				}
				else {
					this.api_key = uuid(val);
				}
			}
		},

		email: {
			type: String
		},

		name: {
			type: String,
			index: true,
		},

		is_active: {
			type: Boolean,
			index: true,
		},

		joined: {
			type: Date,
			index: false
		},

		last_login: {
			type: Date,
			index: false
		},

		location_tracking_enabled: {
			type: Boolean,
			index: false
		},

		newsletter: {
			type: Boolean
		},

		settings: {
			explorer: {
				initial_searches: {
					type: Boolean,
					index: false
				}
			},

			theme: {
				type: String,
				index: false
			}
		},

		social_accounts: {
			type: Array,
			index: false
		},

		subscriptions: {
			type: Array,
			index: false
		},

		age: {
			type: Number,
			index: true,
		},

		// accountType: {
		// 	type: [AccountTypeSchema],
		// 	default: [],
		// },

		contacts: {
			// another mongoose way for providing embedded documents
			email: String,
			phones: [String], // array of strings
		},

		// address: {
		// 	type: AddressSchema,
		// },

		otherData: {
			type: mongoose.Schema.Types.Mixed,
			description: 'Some dynamic data',
		},

		location_estimation_status: String,

		last_location_estimation: {
			type: Date,
			index: false
		},

		tutorials: {
			connections: {
				type: Boolean
			},
			home: {
				type: Boolean
			},
			explorer: {
				type: Boolean
			}
		}

	},
	{
		collection: 'users',
	}
);


export const User = mongoose.model('User', UserSchema);

export const UserTC = composeWithMongoose(User);


UserTC.addResolver({
	name: 'deleteAccount',
	kind: 'mutation',
	type: new graphql.GraphQLObjectType({
		name: 'deleteAccount',
		fields: {
			id: {
				type: graphql.GraphQLString
			}
		}
	}),
	resolve: async ({context}) => {
		let req = context.req;

		let connections = await ConnectionTC.getResolver('findMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		_.each(connections, async function(connection) {
			await deleteConnection(connection._id.toString('hex'), req.user._id.toString('hex'));
		});

		//All Events, Contacts, and Content should be gone after deleteConnection, but try anyway in case there were bugs.
		//Also delete everything else related to that user.
		await EventTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await ContactTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await ContentTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await LocationTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await LocationFileTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await OAuthAppTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await OAuthTokenTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await OAuthTokenSessionTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await PeopleTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await SearchTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await SessionTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await TagTC.getResolver('removeMany').resolve({
			args: {
				filter: {
					user_id_string: req.user._id.toString('hex')
				}
			}
		});

		await UserTC.getResolver('removeOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				}
			}
		});

		context.res.status = 204;
	}
});


UserTC.addResolver({
	name: 'updateApiKey',
	kind: 'mutation',
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({context}) => {
		let req = context.req;

		let updated = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				},
				record: {
					api_key_string: uuid()
				}
			}
		});

		return updated.record;
	}
});

UserTC.addResolver({
	name: 'updateEmail',
	kind: 'mutation',
	args: {
		new_email: 'String!'
	},
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({args, context}) => {
		let existingUser;
		let req = context.req;
		let user = req.user;

		let errors = [];
		let emailTest = emailRegex.test(args.new_email);

		if (emailTest !== true) {
			errors.push('invalid_email');
		}
		else {
			if (args.new_email === user.email) {
				errors.push('email_unchanged');
			}
			else {
				existingUser = await UserTC.getResolver('findOne').resolve({
					args: {
						filter: {
							email: args.new_email
						}
					}
				});

				if (existingUser != null) {
					errors.push('email_in_use');
				}
			}
		}

		if (errors.length === 0) {
			try {
				let emailClient = new EmailClient();

				await EmailUpdateRequestTC.getResolver('removeMany').resolve({
					args: {
						filter: {
							user_id_string: user._id.toString('hex')
						}
					}
				});

				if (user.email && user.email.length > 0) {
					let id = uuid();
					let token = uuid();
					let expiration = moment.utc().add(1800, 'seconds').toDate();

					let record = {
						id: id,
						token_string: token,
						ttl: expiration,
						new_email: args.new_email,
						user_id_string: req.user._id.toString('hex')
					};

					await EmailUpdateRequestTC.getResolver('createOne').resolve({
						args: {
							record: record
						}
					});

					await emailClient.send(user.email, {
						template: 'lifescope-email-change',
						context: {
							token: token,
							new_email: args.new_email
						}
					});

					return user;
				}
				else {
					await UserTC.getResolver('updateOne').resolve({
						args: {
							filter: {
								id: user._id.toString('hex')
							},
							record: {
								email: args.new_email
							}
						}
					});

					await emailClient.send(args.new_email, {
						template: 'lifescope-email-confirm-new',
						context: {
							old_email: null
						}
					});

					user.email = args.new_email;

					return user;
				}
			}
			catch (err) {
				throw err;
			}
		}
		else {
			throw new httpErrors(400, errors.join(','));
		}
	}
});

UserTC.addResolver({
	name: 'updateNewsletter',
	kind: 'mutation',
	args: {
		newsletter: 'Boolean!'
	},
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({args, context}) => {
		let user = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: context.req.user._id.toString('hex')
				},
				record: {
					newsletter: args.newsletter === true
				}
			}
		});

		return user.record;
	}
});


UserTC.addResolver({
	name: 'updateLocationTracking',
	kind: 'mutation',
	args: {
		location_tracking_enabled: 'Boolean!'
	},
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({args, context}) => {
		let req = context.req;

		let updated = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				},
				record: {
					location_tracking_enabled: args.location_tracking_enabled === true
				}
			}
		});

		return updated.record;
	}
});


UserTC.addResolver({
	name: 'updateTheme',
	kind: 'mutation',
	args: {
		theme: 'String!'
	},
	type: UserTC.getResolver('findOne').getType(),
	resolve: async ({args, context}) => {
		let req = context.req;

		let updated = await UserTC.getResolver('updateOne').resolve({
			args: {
				filter: {
					id: req.user._id.toString('hex')
				},
				record: {
					'settings.theme': args.theme
				}
			}
		});

		return updated.record;
	}
});


UserTC.addResolver({
	name: 'userBasic',
	kind: 'query',
	type: basicType,
	resolve: async ({context}) => {
		let result = await UserTC.getResolver('findOne').resolve({
			args: {
				filter: {
					id: context.req.user._id.toString('hex')
				}
			}
		});

		return {
			id: result._id.toString('hex')
		};
	}
});


UserTC.addResolver({
	name: 'allCounts',
	kind: 'query',
	type: allCountType,
	resolve: async ({context}) => {
		//For some reason, counting Locations through graphql-compose-mongoose's resolver is rather slow.
		//Doing the count directly through Mongoose is a lot faster, so I'm using that.
		//If it's due to collection size and something else starts getting very slow, I'll try to implement
		//a more general fix.
		let locationCountPromise = Locations.count({
			user_id: context.req.user._id
		});

		let connectionCountPromise = ConnectionTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let contactCountPromise = ContactTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let contentCountPromise = ContentTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let eventCountPromise = EventTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let peopleCountPromise = PeopleTC.getResolver('count').resolve({
			args: {
				filter: {
					self: false,
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let searchCountPromise = SearchTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let favoriteSearchCountPromise = SearchTC.getResolver('count').resolve({
			args: {
				filter: {
					favorited: true,
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let tagCountPromise = TagTC.getResolver('count').resolve({
			args: {
				filter: {
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let sharedTagCountPromise = TagTC.getResolver('count').resolve({
			args: {
				filter: {
					share: 'public',
					user_id_string: context.req.user._id.toString('hex')
				}
			}
		});

		let connectionCount = await connectionCountPromise;
		let contactCount = await contactCountPromise;
		let contentCount = await contentCountPromise;
		let eventCount = await eventCountPromise;
		let locationCount = await locationCountPromise;
		let peopleCount = await peopleCountPromise;
		let searchCount = await searchCountPromise;
		let favoriteSearchCount = await favoriteSearchCountPromise;
		let tagCount = await tagCountPromise;
		let sharedTagCount = await sharedTagCountPromise;

		return {
			connectionCount: connectionCount,
			contactCount: contactCount,
			contentCount: contentCount,
			eventCount: eventCount,
			locationCount: locationCount,
			peopleCount: peopleCount,
			searchCount: searchCount,
			favoriteSearchCount: favoriteSearchCount,
			tagCount: tagCount,
			sharedTagCount: sharedTagCount
		}
	}
});

UserTC.addResolver({
	name: 'completeTutorial',
	kind: 'mutation',
	type: UserTC.getResolver('findOne').getType(),
	args: {
		tutorial: 'String!'
	},
	resolve: async ({args, context}) => {
		if (tutorials.indexOf(args.tutorial) < 0) {
			throw new httpErrors(400, 'Invalid tutorial name');
		}
		else {
			return UserTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: context.req.user._id.toString('hex')
					},
					record: {
						['tutorials.' + args.tutorial]: true
					}
				}
			})
		}
	}
});