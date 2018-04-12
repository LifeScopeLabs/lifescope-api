<template>
    <div class="modal-content">
        <div id="workflow" class="boxed-group" v-bind:data-provider-id="provider.id">
            <div class="align-center">
                <div class="flexbox flex-x-center">
                    <i v-bind:class="providerIcon(provider.name)"></i>
                    <div class="header flex-grow">New {{ provider.name }} Connection</div>
                    <i v-bind:class="providerIcon(provider.name)" style="color: transparent;"></i>
                </div>
            </div>

            <div class="padded paragraphed">
                <form action="/connections" method="POST">
                    <!--<input type="hidden" name="csrftoken" value="{{ csrf_token }}" />-->
                    <input type="hidden" name="provider_id" v-bind:val="provider.id"/>

                    <div class="align-center">
                        <input class="line-entry align-center" type="text" name="name" v-bind:placeholder="getPlaceholder(provider)" style="padding-top: 0;" autofocus />
                    </div>

                    <div class="source-container" style="margin-top: 25px;">
                        <div class="label">What would you like?</div>
                        <div class="sources">
                            <div v-for="source, name in provider.sources" class="paragraph source-checkbox">
                                <label><input type="checkbox" v-bind:name="name" v-bind:checked="source.enabled_by_default" />{{ name | capitalize }}</label>
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
	export default {
		filters: {
			capitalize: function(value) {
				if (!value) return '';

				value = value.toString();

				return value.charAt(0).toUpperCase() + value.slice(1);
            }
        },
        props: ['provider'],
		methods: {
			providerIcon: function(name) {
				return 'fa fa-' + name.toLowerCase();
			},
			getPlaceholder: function(provider) {
				return 'My ' + provider.name + 'Account';
			}
		}
	}
</script>