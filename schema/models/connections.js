/* @flow */

import _ from 'lodash';
import { graphql } from 'graphql-compose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import config from 'config';
import httpErrors from 'http-errors';
import moment from 'moment';
import mongoose from 'mongoose';

import { AssociationSessionTC } from './association-sessions';
import { ProviderTC } from './providers';

import uuid from '../../lib/util/uuid';


let initializeType = new graphql.GraphQLObjectType({
	name: 'initializeConnection',
	fields: {
		id: graphql.GraphQLString,
		redirectUrl: graphql.GraphQLString
	}
});


export const ConnectionsSchema = new mongoose.Schema(
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
          this._conditions._id = uuid(val);
          
          delete this._conditions.id;
        }
        
        this._id = uuid(val);
      }
    },
    auth: {
      status: {
        authorized: {
          type: Boolean,
          index: false
        },
        complete: {
          type: Boolean,
          index: false
        }
      }
    },
    enabled: {
      type: Boolean,
      index: false
    },
    
    endpoint_data: {
      type: mongoose.Schema.Types.Mixed
  },
    
    frequency: {
      type: Number,
      index: false
    },
    
    last_run: {
      type: Date,
      index: false
    },
    
    permissions: {
      type: mongoose.Schema.Types.Mixed
    },
    
    provider_id: {
      type: Buffer,
      index: false
    },
    provider_id_string: {
      type: String,
      get: function() {
        return this.provider_id.toString('hex')
      },
      set: function(val) {
        if (val && this._conditions && this._conditions.provider_id_string) {
          this._conditions.provider_id = uuid(val);
          
          delete this._conditions.provider_id_string;
        }
        
        this.provider_id = uuid(val);
      }
    },
    provider_name: {
      type: String,
      index: false
    },
    remote_connection_id: {
      type: Buffer,
      index: false
    },
    remote_connection_id_string: {
      type: String,
      get: function() {
        return this.remote_connection_id.toString('hex')
      },
      set: function(val) {
        if (val && this._conditions && this._conditions.remote_connection_id_string) {
          this._conditions.remote_connection_id = uuid(val);
          
          delete this._conditions.remote_connection_id_string;
        }
        
        this.remote_connection_id = uuid(val);
      }
    },
    status: {
      type: String,
      index: false
    },
    user_id: {
      type: Buffer,
      index: false
    },
    user_id_string: {
      type: String,
      get: function() {
        return this.user_id.toString('hex')
      },
      set: function(val) {
        if (val && this._conditions && this._conditions.user_id_string) {
          this._conditions.user_id = uuid(val);
          
          delete this._conditions.user_id_string;
        }
        
        this.user_id = uuid(val);
      }
    }
  },
  {
    collection: 'connections',
  }
);
  

export const Connection = mongoose.model('Connections', ConnectionsSchema);

export const ConnectionTC = composeWithMongoose(Connection);

ConnectionTC.addResolver({
  name: 'initializeConnection',
  kind: 'mutation',
  type: initializeType,
  args: {
    provider_id_string: 'String!',
    name: 'String'
  },
  resolve: async ({ source, args, context, info }) => {
    let bitscoop = env.bitscoop;
    
    await env.validate('#/types/uuid4', args.provider_id_string)
      .catch(function(err) {
        throw new Error('provider_id_string must be a 32-character UUID4 without dashes')
      });
    
    let provider = await ProviderTC.getResolver('findOne').resolve({
      args: {
        filter: {
          id: args.provider_id_string
        }
      },
      projection: {
        sources: true,
        remote_map_id: true,
        remote_map_id_string: true
      }
    });
    
    if (provider == null) {
      throw new httpErrors(404);
    }
    
    let remoteProvider = await bitscoop.getMap(provider.remote_map_id.toString('hex'));

    let endpoints = [];
    let connection = {
      frequency: 1,
      enabled: false,
      permissions: {},

      provider: provider,
      remote_provider: remoteProvider,
      provider_id: provider._id
    };

    // Store valid endpoints.
    _.each(provider.sources, function(source, name) {
      if (_.has(context.req.body, name)) {
        connection.permissions[name] = {
          enabled: true,
          frequency: 1
        };

        endpoints.push(source.mapping);
      }
    });

    endpoints = _.uniq(endpoints);

    let authObj = await bitscoop.createConnection(provider.remote_map_id.toString('hex'), {
      name: args.name,
      endpoints: endpoints,
      redirect_url: remoteProvider.auth.redirect_url + '?map_id=' + provider.remote_map_id.toString('hex')
    });

    await insertAssociationSessions(context, authObj);

    await ConnectionTC.getResolver('createOne').resolve({
      args: {
        record: {
          id: uuid(),
          auth: {
              status: {
                  complete: false
              }
          },
          frequency: 1,
          enabled: false,
          permissions: connection.permissions,
          provider_name: connection.remote_provider.name,
          provider_id: connection.provider_id,
          remote_connection_id: uuid(authObj.id),
        }
      }
    });

    return authObj;
  }
});


async function insertAssociationSessions(context, authObj) {
    if (context.req.user == null) {    
      // Only run if the user is not logged in
      let connectionId = authObj.id;

      let id = uuid();
      let token = uuid();
      let expiration = moment.utc().add(600, 'seconds').toDate();
      // We don't need to have a different cookie for each provider.
		  // Review if we do need to have a different cookie for each provider.
      let cookieName = 'login_assoc';

      await AssociationSessionTC.getResolver('createOne').resolve({
        args: {
          record: {
            id: id,
            token_string: token,
            connection_id_string: connectionId,
            ttl: expiration
          }
        }
      });
      
      // Create cookie so user can login/signup after Oauth validation.
        context.res.cookie(cookieName, token.toString('hex'), {
            domain: config.domain,
            secure: true,
            httpOnly: true,
            expires: expiration
        });
    }
  
    return Promise.resolve();
}
