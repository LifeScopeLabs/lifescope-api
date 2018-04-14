import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import cookieAuthorization from "./lib/middleware/cookie-authorization";
import initialSearches from "./lib/middleware/initial-searches";

module.exports = {
	modules: ['@nuxtjs/apollo'],

	apollo: {
		clientConfigs: {
			default: '../apollo/client-configs/default.js'
		}
	},

	css: [
		'./assets/css/site.min.css'
	],
	build: {
		extend (config, { isDev, isClient }) {
			config.node = {
				dns: 'empty',
				fs: 'empty',
				module: 'empty',
				net: 'empty',
				tls: 'empty'
			}
		},
		vendor: [
			'mixitup',
			'vue-js-modal',
			'vue2-filters'
		]
	},

	plugins: [
		'./plugins/vue-js-modal',
		'./plugins/vue2-filters'
	],

	serverMiddleware: [
		bodyParser.json(),
		cookieParser(),
		cookieAuthorization,
		initialSearches,
	]
};