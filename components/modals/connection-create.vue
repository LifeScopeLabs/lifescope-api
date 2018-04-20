<template>
    <div class="modal-content">
        <div id="workflow" class="boxed-group" v-bind:data-provider-id="provider.id">
            <div class="align-center">
                <div class="flexbox flex-x-center">
                    <i v-bind:class="providerIcon(provider.name)"></i>
                    <div class="header flex-grow">New {{ provider.name }} Connection</div>
                    <i class="fa fa-times-circle" v-on:click="$emit('close')"></i>
                </div>
            </div>

            <div class="padded paragraphed">
                <form action="/connections" method="POST" v-on:submit.self.prevent="createConnection">
                    <!--<input type="hidden" name="csrftoken" value="{{ csrf_token }}" />-->
                    <input type="hidden" name="provider_id" v-bind:val="provider.id" v-model="connectionForm.provider_id"/>

                    <div class="align-center">
                        <input class="line-entry align-center" type="text" name="name" v-bind:placeholder="getPlaceholder(provider)" v-model="connectionForm.name" style="padding-top: 0;" autofocus />
                    </div>

                    <div class="source-container" style="margin-top: 25px;">
                        <div class="label">What would you like?</div>
                        <div class="sources">
                            <div v-for="source, name in provider.sources" class="paragraph source-checkbox">
                                <label><input type="checkbox" v-bind:value="name" v-model="connectionForm.sources"/>{{ name | formatNames }}</label>
                                <div class="tooltip">{{ source.description }}</div>
                            </div>

                        </div>
                    </div>

                    <div class="action">
                        <button class="primary" type="submit">Connect to {{ provider.name }}</button>
                    </div>
                </form>
            </div>
        </div>

        <!--<div id="manage">-->
        <!--<a class="primary" v-bind:href="connectionLink(id)">Manage {{ name }} Connections</a>-->

        <!--</div>-->
    </div>
</template>


<script>
    import _ from 'lodash';
    import initializeConnection from '../../apollo/mutations/initialize-connection.gql';

	export default {
		data: function(context) {
			let sources = _.map(context.provider.sources, function(source, name) {
				return source.enabled_by_default ? name : null;
            });

            return {
            	connectionForm: {
		            provider_id: context.provider.id,
		            name: '',
		            sources: sources
	            }
            }
        },
		filters: {
			formatNames: function(value) {
				if (!value) return '';

				value = value.toString();

				let pieces = value.split('_');

				let capitalized = _.map(pieces, function(value) {
					return value.charAt(0).toUpperCase() + value.slice(1);
                });

				return capitalized.join(' ');
            }
        },
        props: ['provider'],
		methods: {
			providerIcon: function(name) {
				return 'fa fa-' + name.toLowerCase();
			},
			getPlaceholder: function(provider) {
				return 'My ' + provider.name + ' Account';
			},
            createConnection: async function() {
				let form = this.$data.connectionForm;

				let permissions = {};

				_.each(form.sources, function(source) {
					permissions[source] = true;
                });

                let response = await this.$apollo.mutate({
                    mutation: initializeConnection,
                    variables: {
                    	name: form.name,
                        provider_id_string: form.provider_id,
                        permissions: permissions
                    }
                });

                window.location = response.data.initializeConnection.redirectUrl;
            }
		}
	}
</script>

https://accounts.spotify.com/authorize?redirect_uri=https%3A%2F%2Fauth.api.bitscoop.com%2Fdone%2F7d535efa1c4f49feaab4e2d92fd40ef9&response_type=code&state=f89383bd8f0a4b4f8bc5e108d09b4e52&scope=playlist-read-collaborative%20playlist-read-private%20user-library-read&client_id=2463bbece7ab4127b640f3f7e00a2076