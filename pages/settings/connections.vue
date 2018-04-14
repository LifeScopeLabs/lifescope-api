<template>
</template>

<script>
	export default {
		layout: function(context) {
			return 'settings/connections';
		},
		asyncData({ store }) {
			store.state.mode = 'connections';
			store.state.pageName = 'settings connections';
		},
		data: function() {
			return {
				authenticated: this.$store.state.user != undefined
			}
		}
	}
</script>