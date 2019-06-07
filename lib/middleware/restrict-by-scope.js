import _ from 'lodash';
import httpErrors from 'http-errors';


export default function(Resolver, scopes, resolvers) {
	const secureResolvers = {};
	let scopeArray = Array.isArray(scopes) ? scopes : [scopes];

	Object.keys(resolvers).forEach(k => {
		secureResolvers[k] = resolvers[k].wrapResolve(next => rp => {
			let approved = false;

			if (rp.context.req.scopes) {
				_.each(scopeArray, function(scope) {
					if (rp.context.req.scopes.indexOf(scope) >= 0) {
						approved = true;
					}
				});

				if (approved === false) {
					throw new httpErrors(401, 'Token does not have the appropriate scope');
				}
			}

			return next(rp);
		});
	});

	return secureResolvers;
}
