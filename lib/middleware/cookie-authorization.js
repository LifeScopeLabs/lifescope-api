import config from 'config';
import moment from 'moment';

import { SessionTC } from '../../schema/models/sessions';
import { UserTC } from '../../schema/models/users';


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
  
  let sessionResult = await SessionTC.getResolver('findMany').resolve({
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
      id: true,
      token: true,
      csrf_secret: true,
      expires: true,
      user_id: true,
    }
  });
  
  if (sessionResult.length > 1) {
    return Promise.reject(new Error('Duplicate session.'));
  }
  
  if (sessionResult.length === 0) {
    req.session = null;
  }
  else {
    let userResult = await UserTC.getResolver('findOne').resolve({
      args: {
        filter: {
          id: sessionResult[0].user_id.toString('hex')
        }
      }
    });
  
    
    let session = sessionResult[0];
    let user = userResult;
    
    req.session = session;
    req.user = user || null;
  }

  // res.cookie(config.sessions.cookieName, '2EFCEBCFA93E42C7A722023AC5A664EE254502B5C96A41F9B0DDB43F2CEEC2697070D8997FAB4039A2FBDD788DA766CE', {
  //   domain: 'lifescope-api.glitch.me',
  //   secure: true,
  //   httpOnly: true,
  //   expires: 0
  // });
  
  next();
};
