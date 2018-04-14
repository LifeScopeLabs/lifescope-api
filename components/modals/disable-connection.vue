<template>
    <div class="content padded">
        <div class="flexbox flex-end">
            <i class="fa fa-times-circle" v-on:click="$emit('close')"></i>
        </div>

        <div class="body flexbox flex-column flex-x-center">
            <div class="paragraph flexbox flex-column flex-x-center" style="margin-bottom: 15px;">
                <h3>Disable {{ connection.name }}?</h3>
                <div class="instructions">
                    <p>Are you sure you'd like to disable this connection?</p>
                    <p>We'll stop collecting data for this connection while it's disabled.</p>
                    <p>You can re-enable the connection at any time and it'll pick up where it left off.</p>
                </div>
            </div>

            <div class="flexbox flex-x-center">
                <button style="margin-right: 2em" v-on:click="$emit('close')">No, Cancel</button>
                <span class="flex-grow"></span>
                <button class="danger confirm" v-on:click="disableConnection(connection)">Yes, Disable</button>
            </div>
        </div>
    </div>
</template>


<script>
    import patchConnection from '../../apollo/mutations/patch-connection.gql'

	export default {
        props: ['connection'],
		methods: {
			disableConnection: async function(connection) {
                await this.$apollo.mutate({
					mutation: patchConnection,
					variables: {
						id: connection.id,
                        enabled: false
					}
				});

                let cloned = _.cloneDeep(connection);

                cloned.enabled = false;

                connection = cloned;

                console.log(this.$data);

				this.$emit('close');
			}
		}
	}
</script>