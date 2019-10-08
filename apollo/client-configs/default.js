import https from 'https';

import config from 'config';
import { ApolloLink, concat, split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import _ from 'lodash';


export default (ctx) => {
	let httpLinkOptions = {
		uri: 'https://api.lifescope.io/gql',
		credentials: 'same-origin'
	};

	if (process.env.NODE_ENV !== 'production') {
		httpLinkOptions.fetchOptions = {
			agent: new https.Agent({ rejectUnauthorized: false })
		};
	}

	const httpLink = new HttpLink(httpLinkOptions);

	const wsLink = process.client ? new WebSocketLink({
		uri: 'wss://api.lifescope.io/subscriptions',
		options: {
			reconnect: true
		}
	}) : '';

	const link = process.server ? httpLink : split( ({ query }) => {
			const { kind, operation } = getMainDefinition(query);

			return kind === 'OperationDefinition' && operation === 'subscription';
		},
		wsLink,
		httpLink
	);

	const middlewareLink = new ApolloLink((operation, forward) => {
		if (_.has(ctx, 'req.headers')) {
			const headers = ctx.req.headers;

			operation.setContext({
				headers: headers
			});
		}

		if (_.hasIn(ctx, 'store.state.csrf_token')) {
			let headers = operation.getContext().headers;

			if (headers == null) {
				headers = {};
			}

			headers['X-CSRF-Token'] = ctx.store.state.csrf_token;

			operation.setContext({
				headers: headers
			});
		}

		return forward(operation)
	});

	return {
		link: middlewareLink.concat(link),
		cache: new InMemoryCache()
	}
}