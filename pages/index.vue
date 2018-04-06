<template>

</template>

<script>
	export default {
		asyncData({ store }) {
			store.state.mode = 'providers'
		},
		data: function() {
			return { name: 'world' }
		}
	}
</script>