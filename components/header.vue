<template slot="header" v-if="$store.state.mode === 'app' || $store.state.mode === 'home'">
	<header>
		<nav>
			<a id="home" href="/"><img class="logo" src="~/assets/images/logo.png" /></a>
			<search-bar></search-bar>

			<div class="shortcuts">
				<a href="/explore"><i class="fa fa-rocket"></i></a>
				<a href="/providers"><i class="fa fa-plug"></i></a>
				<a href="/settings"><i class="fa fa-cog"></i></a>
			</div>

			<div id="menu-button" v-on:click.stop="openMenu">
				<div class="fa fa-bars"></div>
			</div>
		</nav>

		<div v-if="$store.state.mode === 'app'" class="controls">
			<div class="views">
				<a data-view="feed"><i class="fa fa-clone"></i> <span>Feed</span></a>
				<a data-view="grid"><i class="fa fa-th"></i> <span>Grid</span></a>
				<a data-view="list"><i class="fa fa-list"></i> <span>List</span></a>
			</div>

			<div class="sort">
				<div class="fields"></div>
			</div>

			<div class="facets">
				<div class="current">
					<i class="fa fa-caret-down"></i>
					<span class="name"></span>
					<div class="flex-grow"></div>
					<span class="count"></span>
				</div>
				<div class="container hidden">
					<div class="drawer"></div>
				</div>
			</div>
		</div>
	</header>
</template>
<template v-else>
	<header>
		<nav>
			<a id="home" href="/"><img class="logo" src="~/assets/images/logo.png" /></a>


			<span v-if="$store.state.user != undefined" class="flex-grow"></span>

			<div v-if="$store.state.user != undefined && $store.state.mode === 'provider'" class="flexbox flex-x-center">
				<button id="done" class="primary">Done</button>
			</div>

			<div v-if="$store.state.user != undefined" id="menu-button" v-on:click.stop="openMenu">
				<div class="fa fa-bars"></div>
			</div>

			<div v-if="$store.state.mode === 'provider' && $store.state.user == undefined">
				<span class="flex-grow"></span>

				<div class="login flexbox flex-x-center">
					<div>Sign up or Log in by Connecting to any of the providers below.</div>
					<i class="fa fa-question-circle" v-on=:click="showLoginModal"></i>
				</div>

				<span class="flex-grow"></span>
			</div>
		</nav>
	</header>
</template>

<script>
	import SearchBar from './search.vue';
	import loginHelpModal from '../components/modals/login-help';

	export default {
		components: {
			SearchBar: SearchBar
		},
		methods: {
			openMenu: function() {
				this.$store.state.menu.open = true;
			},
			showLoginModal: function() {
				this.$modal.show(loginHelpModal, {}, {
					height: 'auto',
					scrollable: true
				});
			}
		}
	}
</script>