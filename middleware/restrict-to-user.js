import _ from 'lodash';
import httpErrors from 'http-errors';

import uuid from '../lib/types/uuid';

export default function allowOnlyForLocalhost(Resolver, resolvers: { [name: string]: Resolver }) {
  const secureResolvers = {};
  
  Object.keys(resolvers).forEach(k => {
    secureResolvers[k] = resolvers[k].wrapResolve(next => rp => {
      if (!rp.context.user) {
        throw new httpErrors(404, 'User is not authenticated');
      }
      else {
        if (!rp.args) {
          rp.args = {};
        }

        if (!rp.args.filter) {
          rp.args.filter = {};
        }

        rp.args.filter.user_id_string = rp.context.user._id.toString('hex');

        return next(rp);
      }
    });
  });
  
  return secureResolvers;
}