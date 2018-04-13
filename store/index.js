import Vue from 'vue';
import Vuex from 'vuex';
import moment from 'moment';

Vue.use(Vuex);

require('whatwg-fetch');

const store = () => new Vuex.Store({
	state: {
		cookies: null,
		user: null,
		menu: {
			open: false
		}
	},

	getters: {
		authenticated (state) {
			return state.user != undefined;
		},
		dateJoined (state) {
			return moment(state.user.date_join).format('MMMM DD, YYYY')
		}
	},

	mutations: {
		SET_REQ: function(state, req) {
			state.cookies = req.cookies;
			state.user = req.user;
		}
	},

	actions: {
		async nuxtServerInit({ commit }, { req }) {
			await commit('SET_REQ', req);
		}
	}
});

export default store;