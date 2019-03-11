'use strict';

import Tokens from 'csrf';
import _ from 'lodash';
import config from 'config';
import moment from 'moment';
import useragent from 'useragent'

import uuid from './util/uuid';

import { SessionTC } from '../schema/models/sessions';


let options = _.pick(config.csrf, ['saltLength', 'secretLength']);
let tokens = new Tokens(options);


function versionString(obj) {
	let str = '';

	if (obj.major) {
		str += obj.major + '.';
	}

	if (obj.minor) {
		str += obj.minor + '.';
	}

	if (obj.patch) {
		str += obj.patch + '.';
	}

	return str.replace(/\.+$/, '');
}

export const Create = async function(req, user, options) {
	options = options || {};

	let agent = useragent.parse(req.headers['user-agent']);
	let expiration = (options.persist === true && options.pending !== true) ? config.sessions.expiration : config.sessions.sessionExpiration;
	let expires = moment.utc().add(expiration, 'seconds').toDate();
	let ttl = (options.persist === true) ? expires : moment.utc().add(7, 'days').toDate();
	let agentOS = agent.os; // Calculate once to save on overhead.
	let agentDevice = agent.device; // Calculate once to save on overhead.

	let document = {
		id: uuid(),
		ip: req.meta.ip,
		meta: {
			agent: agent.source,
			browser: {
				family: agent.family,
				version: versionString(agent)
			},
			os: {
				family: agentOS.family,
				version: versionString(agentOS)
			},
			device: {
				family: (agentDevice.family.toLowerCase() === 'other') ? 'Computer' : agentDevice.family,
				version: versionString(agentDevice)
			}
		},
		pending: options.pending === true,
		token: (uuid() + uuid() + uuid()).toUpperCase(),
		csrf_secret: tokens.secretSync(),
		created: moment.utc().toDate(),
		expires: expires,
		persist: options.persist === true,
		ttl: ttl
	};

	if (user != null && user._id != null) {
		document.user_id_string = user._id.toString('hex');
	}

	let session = _.pick(document, ['token', 'csrf_secret', 'expires']);

	await SessionTC.getResolver('createOne').resolve({
		args: {
			record: document
		}
	});

	return session;
};

export const Remove = async function(req) {
	let sessionid = req.cookies[config.sessions.cookieName];

	if (!sessionid) {
		return Promise.resolve();
	}

	await SessionTC.getResolver('updateOne').resolve({
		args: {
			filter: {
				token: sessionid
			},
			record: {
				logout: moment.utc().toDate()
			}
		}
	});

	return null;
};