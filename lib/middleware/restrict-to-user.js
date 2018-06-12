import httpErrors from 'http-errors';


export default function(Resolver, resolvers: { [name: string]: Resolver }) {
  const secureResolvers = {};
  
  Object.keys(resolvers).forEach(k => {
    secureResolvers[k] = resolvers[k].wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new httpErrors(404, 'User is not authenticated');
      }
      else {
        if (!rp.args) {
          rp.args = {};
        }

        if (!rp.args.filter) {
          rp.args.filter = {};
        }

        if (rp.info.fieldName === 'userOne') {
          rp.args.filter.id = rp.context.req.user._id.toString('hex');
        }
        else {
          rp.args.filter.user_id_string = rp.context.req.user._id.toString('hex');
        }

        return next(rp);
      }
    });
  });
  
  return secureResolvers;
}
