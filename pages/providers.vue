<template>
</template>

<script>
	export default {
		layout: 'providers',
		asyncData({ store }) {
			store.state.mode = 'home';
            store.state.pageName = 'providers';
		},
		data: function() {
			return {
				authenticated: this.$store.state.user != undefined
			}
		}
	}
</script>