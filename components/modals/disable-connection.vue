<template>
    <div class="content padded" v-modal="connection">
        <div class="flexbox flex-end">
            <i class="fa fa-times-circle" v-on:click="$emit('close')"></i>
        </div>

        <div class="body flexbox flex-column flex-x-center">
            <div class="paragraph flexox flex-column flex-x-center" style="margin-bottom: 15px;">
                <h3>Disable {{ connection.name }}?</h3>
                <div class="instructions">
                    <p>Are you sure you'd like to disable this connection?</p>
                    <p>We'll stop collecting data for this connection while it's disabled.</p>
                    <p>You can re-enable the connection at any time and it'll pick up where it left off.</p>
                </div>
            </div>

            <button style="margin-right: 2em" v-on:click="$emit('close')">No, Cancel</button>
            <button class="danger confirm" v-on:click="deleteConnection(connection)">Yes, Disable</button>
        </div>
    </div>
</template>


<script>
    import patchConnection from '../../apollo/mutations/patch-connection.gql'

	export default {
		data: function() {
			return {
				connection: null
            }
        },
		methods: {
            disableConnection: async function(connection) {
                await this.$apollo.mutate({
                    mutation: patchConnection,
                    variables: {
                    	enabled: false
                    }
                });
            }
		}
	}
</script>