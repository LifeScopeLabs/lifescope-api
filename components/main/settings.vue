<template>
    <main>
        <section>
            <aside id="left">
                <div class="boxed-group settings-menu">
                    <div>Settings</div>

                    <div>
                        <a href="/settings/account">Account</a>
                    </div>

                    <div>
                        <a href="/settings/connections">Connections</a>
                    </div>
                </div>
            </aside>

            <section class="flexbox flex-column flex-grow">
                <section id="account" v-if="$store.state.mode === 'account'">
                    <div class="boxed-group">
                        <div class="title">Delete Account</div>

                        <div class="padded paragraphed">
                            <p>
                                You can easily delete your LifeScope account if you no longer need it.
                                Once you delete your account you will lose access to all the data you've stored with us.
                            </p>

                            <div>
                                <button id="delete" class="danger" v-on:click="showAccountDeleteModal">Delete Account</button>
                            </div>
                        </div>
                    </div>

                    <modals-container />
                </section>
                <section id="connections" v-if="$store.state.mode === 'connections'">
                    <div v-for="connection in orderBy(connectionMany, 'provider.name')" v-bind:class="{active : $data.activeConnection === connection.id}" class="connection boxed-group" v-bind:data-id="connection.id" v-bind:data-provider-id="connection.provider.id">
                        <div class="flexbox flex-x-center title" v-on:click="toggleActive(connection.id)">
                            <div class="icon-name">
                                <i v-bind:class="getIcon(connection.provider.name)"></i>
                                <div class="flex-grow name">{{ connection.name }}</div>
                                <div class="disabled"></div>
                            </div>
                            <div class="last-run">
                                <div v-if="connection.last_run != null" class="updates">
                                    {{ getUpdated(connection.last_run) }}
                                </div>
                                <div v-else class="updates">
                                    <div>Initial update pending</div>
                                    <span></span>
                                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                                </div>
                            </div>

                            <i class="fa fa-caret-down expand-indicator"></i>
                        </div>

                        <form class="auto" v-on:submit.prevent="">
                            <div class="padded paragraphed">
                                <div>
                                    <div class="flexbox flex-x-center label">
                                        <div>Name</div>
                                        <i class="fa fa-check-circle flex-grow success-icon" data-for="name" v-bind:data-namespace="connection.id"></i>
                                    </div>
                                    <div class="text-box shrink">
                                        <input name="name" type="text" v-bind:value="connection.name" />
                                    </div>
                                </div>

                                <div>
                                    <div class="label">What would you like?</div>
                                    <div>
                                        <div v-for="permission, name in orderBy(connection.provider.sources, 'name')" class="paragraph ">
                                            <div class="flexbox flex-x-center">
                                                <label><input class="flag" type="checkbox" v-bind:value="permission.$key" v-model="permissions[connection.id]" v-on:change="updatePermissions(connection)"/>{{ permission.$value.name }}</label>
                                                <i class="fa fa-check-circle flex-grow success-icon" v-bind:data-for="name" v-bind:data-namespace="connection.id"></i>
                                            </div>
                                            <div class="tooltip" data-for="">{{ permission.$value.description }}</div>
                                        </div>
                                    </div>
                                </div>

                                <input class="hidden" type="submit" />

                                <div v-if="connection.provider.auth_type === 'oauth2' && connection.auth.status.authorized !== true" class="reauthorize">
                                    <button class="primary" v-on:click="getConnectionReauthorization(connection)">Reauthorize</button>
                                    <div>The changes you have made require you to re-authorize this connection to {{ connection.provider.name }}.</div>
                                    <div>Retrieval of your data may not work properly until you re-authorize.</div>
                                </div>

                                <div class="delete-disable">
                                    <button v-if="connection.enabled === true" class="danger disable" v-on:click.prevent="showDisableModal(connection)">Disable</button>
                                    <button v-else class="primary enable" v-on:click.prevent="enableConnection(connection)">Enable</button>

                                    <span class="flex-grow"></span>
                                    <button class="danger delete" v-on:click.prevent="showConnectionDeleteModal(connection)">Delete</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <a id="big-add" class="flexbox flex-center" href="https://app.lifescope.io/providers">
                        <i class="fa fa-plus"></i>
                    </a>
                </section>

                <modals-container />
            </section>
        </section>
    </main>
</template>

<script>
    import _ from 'lodash';
    import moment from 'moment';

    import connectionMany from '../../apollo/queries/connection-many.gql';
    import connectionDeleted from '../../apollo/subscriptions/connection-deleted.gql';
    import connectionUpdated from '../../apollo/subscriptions/connection-updated.gql';
    import deleteAccountModal from '../modals/account-delete';
    import deleteConnectionModal from '../modals/connection-delete';
    import disableConnectionModal from '../modals/connection-disable';
    import patchConnection from '../../apollo/mutations/patch-connection.gql'

    function isBefore(value) {
	    let now = moment();
	    let parsedValue = moment(new Date(value));

	    let delta = now.diff(parsedValue);

	    return delta > 0;
    }

    function relativeTime(value) {
	    let parsedValue = moment(new Date(value));

	    return moment(parsedValue).fromNow();
    }

    export default {
    	data: function() {
    	    return {
    	    	activeConnection: null,
    	    	connectionMany: null,
                permissions: {}
            }
        },
    	filters: {
    		sortAlphabetically: function(values, field) {
    			return _.sortBy(values, [field]);
            },
        },
    	methods: {
    		getIcon: function(name) {
			    return 'fa fa-' + name.toLowerCase() + ' fa-2x';
            },
            getUpdated: function(lastRun) {
    			return (isBefore(lastRun) ? 'Updated ' : 'Updating ') + relativeTime(lastRun);
            },
            toggleActive: function(id) {
    			this.$data.activeConnection = (this.$data.activeConnection === id) ? null : id;
            },
		    showDisableModal: function(connection) {
			    this.$modal.show(disableConnectionModal, {
				    connection: connection
			    }, {
			    	name: 'disableModal',
				    height: 'auto',
				    scrollable: true
			    });
		    },
            showAccountDeleteModal: function() {
    		    this.$modal.show(deleteAccountModal, {}, {
    		    	height: 'auto',
                    scrollable: true
                })
            },
		    showConnectionDeleteModal: function(connection) {
			    this.$modal.show(deleteConnectionModal, {
				    connection: connection
			    }, {
				    height: 'auto',
				    scrollable: true
			    });
		    },
            enableConnection: async function(connection) {
    			await this.$apollo.mutate({
                    mutation: patchConnection,
                    variables: {
                    	id: connection.id,
                        enabled: true
                    }
                });
            },
            getConnectionReauthorization: async function(connection) {
    		    window.location.href = connection.auth.redirectUrl;
            },
            updatePermissions: _.debounce(async function(connection) {
            	let sources = connection.provider.sources;

	            let permissions = {};

	            _.each(sources, function(source, name) {
	            	permissions[name] = false;
                });

	            _.each(this.$data.permissions[connection.id], function(source) {
	            	if (typeof source === 'string') {
			            permissions[source] = true;
		            }
	            });

	            await this.$apollo.mutate({
		            mutation: patchConnection,
		            variables: {
		            	id: connection.id,
			            permissions: permissions
		            }
	            });
            }, 1000)
        },
	    apollo: {
		    connectionMany: {
			    query: connectionMany,
			    prefetch: true,
                result ({ data }) {
			    	let self = this;
                    let connections = data.connectionMany;

                    _.each(connections, function(connection) {
					    self.$data.permissions[connection.id] = _.map(connection.provider.sources, function(source, name) {
					    	return connection.permissions && connection.permissions.hasOwnProperty(name) && connection.permissions[name].enabled === true ? name : null;
                        });
                    });
                },
                subscribeToMore: [
                	{
                        document: connectionUpdated,
                        updateQuery: function(previousResult, { subscriptionData }) {
                            let newData = subscriptionData.data.connectionUpdated;

                            if (newData) {
                                let id = newData.id;

                                let replacing = _.find(previousResult.connectionMany, function(item) {
                                    return item.id === id;
                                });

                                replacing = newData;
                            }

                            return previousResult;
                        }
                    },
                    {
                    	document: connectionDeleted,
                        updateQuery: function(previousResult, { subscriptionData }) {
                    		let returned = previousResult;
                    		let newData = subscriptionData.data.connectionDeleted;

                    		if (newData) {
                    			let id = newData.id;
                    			let copy = _.clone(previousResult);

                    			copy.connectionMany = copy.connectionMany.filter(item => item.id !== id);

                    			returned = copy;
                            }

                            return returned;
                        }
                    }
                ]
		    }
	    },
    }
</script>