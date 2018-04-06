import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

require('whatwg-fetch');

const store = () => new Vuex.Store({
	state: {
		cookies: null,
		user: null
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