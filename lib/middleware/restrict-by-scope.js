import httpErrors from 'http-errors';


export default function(Resolver, scope, resolvers: { [name: string]: Resolver }) {
  const secureResolvers = {};
  
  Object.keys(resolvers).forEach(k => {
    secureResolvers[k] = resolvers[k].wrapResolve(next => rp => {
      if (rp.context.req.scopes && rp.context.req.scopes.indexOf(scope) < 0) {
	      throw new httpErrors(401, 'Token does not have the appropriate scope');
      }
      else {
        return next(rp);
      }
    });
  });
  
  return secureResolvers;
}
