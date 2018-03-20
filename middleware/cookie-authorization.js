import _ from 'lodash';
import config from 'config';
import moment from 'moment';

import { SessionTC } from '../schema/models/session';


let $lookup = {
	$lookup: {
		from: 'users',
		localField: 'user_id',
		foreignField: '_id',
		as: 'users'
	}
};

let $project = {
	$project: {
		_id: false,
		token: true,
		csrf_secret: true,
		expires: true,
		'users._id': true,
		'users.handle': true,
		'users.email': true,
		'users.last_name': true,
		'users.first_name': true,
		'users.last_login': true,
		'users.settings': true
	}
};


export default async function(req, res, next) {
  let cookieConsent = config.cookieConsent;

	if (!req.cookies['cookieconsent']) {
		if (req.cookies['sessionid']) {
			res.clearCookie('sessionid', {
				domain: config.domain,
				secure: true,
				httpOnly: true
			});
		}
	}
  
  console.log(req.cookies);
  
  let result = await SessionTC.getResolver('findMany').resolve({
    args: {
      filter: {
        token: req.cookies['sessionid'],
        expires: {
          $gt: moment.utc().toDate()
        },
        logout: null
      }
    },
    projection: {
      user: true,
      token: true,
      csrf_secret: true,
      expires: true
    }
  });
  
  console.log(result);

  res.cookie(config.sessions.cookieName, '2EFCEBCFA93E42C7A722023AC5A664EE254502B5C96A41F9B0DDB43F2CEEC2697070D8997FAB4039A2FBDD788DA766CE', {
    domain: 'lifescope-api.glitch.me',
    secure: true,
    httpOnly: true,
    expires: 0
  });
  
  // console.log(result);

//   mongo.db('live').collection('sessions').aggregate([$match, $lookup, $project]).toArray()
//     .then(function(sessions) {
//       if (sessions.length > 1) {
//         return Promise.reject(new Error('Duplicate session.'));
//       }

//       if (sessions.length === 0) {
//         req.session = null;
//       }
//       else {
//         let session = _.omit(sessions[0], 'users');
//         let user = sessions[0].users[0];

//         req.session = session;
//         req.user = user || null;
//       }

//       next();
//     })
//     .catch(function(err) {
//       next(err);
//     });
  
  next();
};
