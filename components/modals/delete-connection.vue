<template>
    <div class="content padded" v-modal="connection">
        <div class="flexbox flex-end">
            <i class="fa fa-times-circle" v-on:click="$emit('close')"></i>
        </div>

        <div class="body flexbox flex-column flex-x-center">
            <div class="paragraph flexox flex-column flex-x-center" style="margin-bottom: 15px;">
                <h3>Delete {{ connection.name }}?</h3>
                <div class="instructions">
                    <p>Are you sure you'd like to delete this connection?</p>
                    <p>We'll delete all stored data for this connection. If you want to get that data back, you will have to connect to this service again.</p>
                </div>
                <div class="last-connection hidden">
                    <p>You cannot delete your last connection. Without any connections, you cannot access your acccount.</p>
                    <p>If you would like to delete this connection, make a connection to another provider first.</p>
                    <p>You can also delete this account, which will get rid of this connection, but you will lose all of your saved searches, tags, etc.</p>
                </div>
            </div>

            <button style="margin-right: 2em" v-on:click="$emit('close')">No, Cancel</button>
            <button class="danger confirm" v-on:click="deleteConnection(connection)">Yolo, Delete</button>
        </div>
    </div>
</template>


<script>
    import eliminateConnection from '../../apollo/mutations/eliminate-connection.gql';

	export default {
		props: ['connection'],
		methods: {
            deleteConnection: async function(connection) {
                await this.$apollo.mutate({
                    mutation: eliminateConnection,
                    variables: {
                    	id: connection.id
                    }
                });
            }
		}
	}
</script>