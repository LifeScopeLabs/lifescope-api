import https from 'https';

import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import _ from 'lodash';

export default (ctx) => {
	const httpLink = new HttpLink({
		//Remove fetchOptions in production, as it's only needed for ignoring certs in dev
		fetchOptions: {
			agent: new https.Agent({ rejectUnauthorized: false })
		},
		uri: 'https://app.lifescope.io/gql',
		credentials: 'same-origin'
	});

	const middlewareLink = new ApolloLink((operation, forward) => {
		if (_.has(ctx, 'req.headers')) {
			const headers = ctx.req.headers;

			operation.setContext({
				headers: headers
			});
		}

		return forward(operation)
	});

	return {
		link: middlewareLink.concat(httpLink),
		// link: httpLink,
		cache: new InMemoryCache()
	}
}