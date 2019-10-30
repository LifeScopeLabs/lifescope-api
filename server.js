import 'idempotent-babel-polyfill';

import { createServer } from 'http';

import BitScoop from 'bitscoop-sdk';
import _ from 'lodash';
import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import mongoose from 'mongoose';

import csrf from './lib/middleware/csrf';
import views from './lib/views';
import cookieAuthorization from './lib/middleware/cookie-authorization';
import keyAuthorization from './lib/middleware/key-authorization';
import tokenAuthorization from './lib/middleware/token-authorization';
import wsCookieAuthorization from './lib/middleware/ws-cookie-authorization';
import meta from './lib/middleware/meta';
import { crudAPI } from './schema';
import { loadValidator } from './lib/validator';

const BITSCOOP_API_KEY = config.bitscoop.api_key;
const MONGODB_URI = config.mongodb.address;

const server = express();
const wsServer = createServer(function(req, res) {
	res.writeHead(200);
	res.end();
});

const httpListenPort = 3000;
const wsListenPort = 3001;

const opts = {
	autoReconnect: true,
	reconnectTries: Number.MAX_VALUE,
	reconnectInterval: 1000,
	autoIndex: false
};

const bitscoop = new BitScoop(BITSCOOP_API_KEY, config.bitscoop.arguments);

server.use(
	cors({
		origin: config.cors.address,
		credentials: config.cors.credentials,
	})
);

mongoose.connect(MONGODB_URI, opts);

const mongooseConnect = mongoose.connection;

const pubSub = new PubSub();

mongooseConnect.on('error', e => {
	if (e.message.code === 'ETIMEDOUT') {
		console.log(e); //eslint-disable-line no-console
		mongoose.connect(MONGODB_URI, opts);
	}

	console.log(e); //eslint-disable-line no-console
});

mongooseConnect.once('open', () => {
	console.log(`MongoDB successfully connected to ${MONGODB_URI}`); //eslint-disable-line no-console
});

loadValidator(config.validationSchemas)
	.then(async function(validate) {
		global.env = {
			bitscoop: bitscoop,
			validate: validate,
			pubSub: pubSub
		};

		server.use(
			crudAPI.uri,
			meta,
			bodyParser.json({
				limit: '15MB'
			}),
			cookieParser(),
			tokenAuthorization,
			keyAuthorization,
			cookieAuthorization,
			csrf.validate,

			graphqlExpress((req, res) => ({
				schema: crudAPI.schema,
				tracing: true,
				context: {req, res},
				formatError: error => ({
					message: error.message,
					locations: error.locations,
					stack: error.stack ? error.stack.split('\n') : [],
					path: error.path
				})
			})));


		// http://localhost:3000/gql-i/
		server.get(`${crudAPI.uri}-i`, graphiqlExpress({
			endpointURL: crudAPI.uri,
			subscriptionsEndpoint: 'wss://api.lifescope.io/subscriptions'
		}));

		// http://localhost:3000/gql-p/
		server.get(`${crudAPI.uri}-p`, async (req, res, next) => {
			let csrftoken, sessionid;

			let cookie = req.headers.cookie;
			let cookieSplit = cookie.split('; ');

			_.each(cookieSplit, function(cookie) {
				let keyVal = cookie.split('=');

				if (keyVal[0] === 'sessionid') {
					sessionid = keyVal[1];
				}
			});

			if (sessionid != null) {
				let session = await mongooseConnect.db.collection('sessions').findOne({
					token: sessionid
				});

				csrftoken = csrf.tokens.create(session.csrf_secret);
			}

			expressPlayground({
				endpoint: crudAPI.uri,
				headers: {
					'X-CSRF-Token': csrftoken
				},
				subscriptionsEndpoint: 'wss://api.lifescope.io/subscriptions',
				settings: {
					'request.credentials': 'include'
				}
			})(req, res, next)
		});

		server.use(
			'/',
			meta,
			bodyParser.json({
				limit: '15MB'
			}),
			bodyParser.urlencoded({
				limit: '15MB'
			}),
			cookieParser(),
			cookieAuthorization,
			views
		);

		server.listen(httpListenPort);

		console.log('Lifescope API listening on: ' + httpListenPort + ' at ' + new Date()); //eslint-disable-line no-console

		wsServer.listen(wsListenPort, function() {
			console.log('WS Server running on ' + wsListenPort); //eslint-disable-line no-console

			SubscriptionServer.create({
				schema: crudAPI.schema,
				execute: execute,
				subscribe: subscribe,
				onConnect: async function(connectionParams, webSocket, context) {
					let cookies = {};
					let cookie = _.get(context, 'request.headers.cookie');

					let split = cookie.split('; ');

					_.each(split, function(item) {
						let split = item.split('=');

						cookies[split[0]] = split[1];
					});


					let user = await wsCookieAuthorization(cookies.sessionid);

					return {
						user: user
					};
				}
			}, {
				server: wsServer,
				path: '/subscriptions'
			});
		});
	});
