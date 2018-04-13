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
                                <button id="delete" class="danger" v-on:click="showDeleteModal">Delete Account</button>
                            </div>
                        </div>
                    </div>

                    <modals-container />
                </section>
                <section id="connections" v-if="$store.state.mode === 'connections'">
                    <div v-for="connection in orderBy(connectionMany, 'provider.name')" class="connection boxed-group" v-bind:data-id="connection.id" v-bind:data-provider-id="connection.provider.id">
                        <div class="flexbox flex-x-center title">
                            <div class="icon-name">
                                <i v-bind:class="getIcon(connection.provider.name)"></i>
                                <div class="flex-grow name">{{ connection.name }}</div>
                                <div class="disabled"></div>
                            </div>
                            <div class="last-run">
                                <div v-if="connection.last_run != null" class="updates">
                                    {{ connection.last_run | isBefore ? 'Updated ' : 'Updating ' + connection.last_run | relativeTime }}
                                </div>
                                <div v-else class="updates">
                                    <div>Initial update pending</div>
                                    <span></span>
                                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                                </div>
                            </div>

                            <i class="fa fa-caret-down expand-indicator"></i>
                        </div>

                        <form class="auto">
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
                                        <div v-for="permission in orderBy(connection.permissions, 'name')" class="paragraph">
                                            <div class="flexbox flex-x-center">
                                                <label><input class="flag" type="checkbox" v-bind:name="permission.name" v-bind:checked="permission.enabled" />{{ permission.source.name }}</label>
                                                <i class="fa fa-check-circle flex-grow success-icon" v-bind:data-for="permission.name" v-bind:data-namespace="connection.id"></i>
                                            </div>
                                            <div class="tooltip" data-for="">{{ permission.source.description }}</div>
                                        </div>
                                    </div>
                                </div>

                                <input class="hidden" type="submit" />

                                <div v-if="connection.provider.auth_type === 'oauth2' && connection.auth.status.authorized !== true" class="reauthorize">
                                    <button class="primary">Reauthorize</button>
                                    <div>The changes you have made require you to re-authorize this connection to {{ connection.provider.name }}.</div>
                                    <div>Retrieval of your data may not work properly until you re-authorize.</div>
                                </div>

                                <div class="delete-disable">
                                    <button v-if="connection.enabled === true" class="danger disable">Disable</button>
                                    <button v-else class="primary enable">Enable</button>

                                    <span class="flex-grow"></span>
                                    <button class="danger delete">Delete</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <a id="big-add" class="flexbox flex-center" href="https://app.lifescope.io/providers">
                        <i class="fa fa-plus"></i>
                    </a>
                </section>
            </section>
        </section>
    </main>
</template>

<script>
    import _ from 'lodash';
    import moment from 'moment';

    import deleteAccountModal from '../modals/delete-account';
    import connectionMany from '../../apollo/queries/connection-many.gql';

    export default {
    	data: function() {
    	    return {
    	    	connectionMany: null
            }
        },
    	filters: {
    		sortAlphabetically: function(values, field) {
    			return _.sortBy(values, [field]);
            },
            isBefore: function(value) {
	            let now = moment();
	            let parsedValue = moment(new Date(value));

	            let delta = now.diff(parsedValue);

	            return delta > 0;
            },
            relativeTime: function(value) {
	            let parsedValue = moment(new Date(value));

	            return moment(parsedValue).fromNow();
            }
        },
    	methods: {
    		getIcon: function(name) {
			    return 'fa fa-' + name.toLowerCase + 'fa-2x';
            },
            // getUpdated: function(lastRun) {
    			// if (connection.last_run)
	         //    {% if connection.last_run|is_before %}Updated {% else %} Updating {% endif %}{{ connection.last_run|relative_time }}
            // },
		    showDeleteModal: function() {
			    this.$modal.show(deleteAccountModal, {}, {
				    height: 'auto',
				    scrollable: true
			    })
		    }
        },
	    apollo: {
		    connectionMany: {
			    query: connectionMany,
			    prefetch: true,
		    }
	    },
    }
</script>