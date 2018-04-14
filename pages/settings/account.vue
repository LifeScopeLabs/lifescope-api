<template>
</template>

<script>
	export default {
		layout: function(context) {
			return 'settings/account';
		},
		asyncData({ store }) {
			store.state.mode = 'account';
			store.state.pageName = 'settings account';
		},
		data: function() {
			return {
				authenticated: this.$store.state.user != undefined
			}
		}
	}
</script>