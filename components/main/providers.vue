<template>
    <main>
        <div class="scroller">
            <div id="provider-grid">
                <div v-if="$store.getters.authenticated" v-model="providerHydratedMany"  v-for="provider in providerHydratedMany" v-on:click="showConnectionModal(provider)" v-bind:key="provider.id" v-bind:class="[{associated: provider.assoc_count > 0}, provider.tags]" class="mix" v-bind:data-id="provider.id" v-bind:data-assoc-count="provider.assoc_count">
                    <div>
                        <span v-if="provider.assoc_count > 1">{{ provider.assoc_count }}</span>
                        <h1><i v-bind:class="providerIcon(provider.name)"></i></h1>
                        <p>{{ provider.name }}</p>
                    </div>
                </div>
                <div v-if="$store.getters.authenticated !== true" v-model="providerWithMapMany"  v-for="provider in providerWithMapMany" v-on:click="showConnectionModal(provider)" v-bind:key="provider.id" v-bind:class="[provider.tags]" class="mix" v-bind:data-id="provider.id">
                    <div>
                        <h1><i v-bind:class="providerIcon(provider.name)"></i></h1>
                        <p>{{ provider.name }}</p>
                    </div>
                </div>
            </div>
        </div>

        <modals-container/>
    </main>
</template>

<script>
    import providerHydratedMany from '../../apollo/queries/provider-hydrated-many.gql';
    import providerWithMapMany from '../../apollo/queries/provider-with-map-many.gql';
    import connectionCreateModal from '../../components/modals/connection-create';
    import loginHelpModal from '../../components/modals/login-help';

    export default {
    	data: function() {
    		return {
    			providerHydratedMany: [],
                providerWithMapMany: []
            }
        },
        methods: {
        	providerIcon: function(name) {
        		return 'fa fa-' + name.toLowerCase();
            },
            connectionLink: function(id) {
        		return 'https://app.lifescope.io/settings/connections?provider=' + id;
            },
            getPlaceholder: function(provider) {
        		return 'My ' + provider.name + 'Account';
            },
            showLoginHelpModal: function() {
        		this.$modal.show(loginHelpModal);
            },
            showConnectionModal: function(provider) {
        		this.$modal.show(connectionCreateModal, {
        			provider: provider
                }, {
        			height: 'auto',
                    scrollable: true
                });
            }
        },
        apollo: {
        	providerHydratedMany: {
                query: providerHydratedMany,
		        prefetch: true,
                skip: function() {
                	return this.$store.getters.authenticated !== true;
                }
            },
            providerWithMapMany: {
        		query: providerWithMapMany,
                prefetch: true,
                skip: function() {
        			return this.$store.getters.authenticated === true;
                }
            }
        },
        mounted() {
            let mixitup = require('mixitup');

    		this.$store.mixer = mixitup('#provider-grid', {});

        },
        updated() {
    		this.$nextTick(function() {
    			this.$store.mixer.forceRefresh();
            });
        }
    }
</script>