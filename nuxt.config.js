import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import cookieAuthorization from "./lib/middleware/cookie-authorization";

module.exports = {
	build: {
		extend (config, { isDev, isClient }) {

			config.node = {
				dns: 'empty',
				fs: 'empty',
				module: 'empty',
				net: 'empty',
				tls: 'empty'
			}
		}
	},
	serverMiddleware: [
		bodyParser.json(),
		cookieParser(),
		cookieAuthorization,
	]
};