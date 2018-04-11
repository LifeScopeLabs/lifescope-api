<template>
</template>

<script>
	export default {
		layout: function(context) {
			return context.req.user != undefined ? 'home' : 'providers';
        },
		asyncData({ store }) {
			store.state.mode = 'home';
            store.state.pageName = store.state.user ? 'home' : 'providers';
		},
		data: function() {
			return {
				authenticated: this.$store.state.user != undefined
			}
		}
	}
</script>