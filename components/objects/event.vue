<template>
	<div class="object event" v-bind:id="event.id">
		<aside class="details">
			<div class="type">
				<i v-bind:class="getEventTypeIcon(event.type)"></i>

				<span v-if="event.context">
					{{ event.context }}
				</span>
				<span v-else>
					{{ event.type }}
				</span>

				<aside class="action-bar">
					<span>Tag</span><i class="fa fa-hashtag"></i>
				</aside>
			</div>

			<div class="provider">
				<i v-bind:class="getProviderIcon(event.hydratedConnection.provider)"></i>
				<span>{{ event.connection.name | truncate(30) }}</span>
			</div>

			<div v-if="event.date" class="date">
				<div>
					<div>
						<i class="fa fa-calendar"></i> <span>{{ event.date | dateFilter }}</span>
					</div>


					<div v-if="!event.date" class="estimation">
						<i class="fa fa-flask"></i> <span>Estimated</span>
					</div>

					<div v-else>
						<i class="fa fa-clock-o"></i> <span>{{ event.date | timeFilter }}</span>
					</div>
				</div>
			</div>

			<div class="tagging">
				<div class="tags">
					<span v-for="tag in tags">#{{ tag }}</span>
				</div>
			</div>
		</aside>

		<section v-if="event.content && event.content.length > 0" class="content">
			<user-content v-for="content in event.hydratedContent" v-bind:key="content.id" v-bind:content="content" v-bind:connection="event.hydratedConnection"></user-content>
		</section>

		<aside v-if="(event.contacts && event.contacts.length > 0) || (event.people && event.people.length > 0) || (event.organizations && event.organizations.length > 0)" class="interactions">
			<div v-if="event.contact_interaction_type">{{ event.content_interaction_type }}</div>
			<div class="objects">
				<user-contact v-for="contact in event.hydratedContacts" v-bind:key="contact.id" v-bind:contact="contact" v-bind:connection="event.hydratedConnection"></user-contact>
			</div>
			<div v-if="event.contacts > 3 || event.people > 3 || event.organizations > 3" class="expand">More</div>
		</aside>
	</div>
</template>

<script>
	import icons from '../../lib/util/icons';
	import UserContact from '../objects/contact';
	import UserContent from '../objects/content';

	export default {
		components: {
			UserContact,
			UserContent
		},
		data: function() {
			return {
				tags: function() {
					let tags = [];

					if (this.event.tagMasks) {
						_.forEach(this.tagMasks.source, function(tag) {
							if (tags.indexOf(tag) === -1) {
								tags.push(tag);
							}
						});

						_.forEach(this.tagMasks.added, function(tag) {
							if (tags.indexOf(tag) === -1) {
								tags.push(tag);
							}
						});

						_.forEach(this.tagMasks.removed, function(tag) {
							let index = tags.indexOf(tag);

							if (index > -1) {
								tags.splice(index, 1);
							}
						});
					}

					return tags;
				}
			}
		},
		props: [
			'event'
		],
		filters: {

		},
		methods: {
			getEventTypeIcon: function(type) {
				return icons('event', type)
			},
			getProviderIcon: function(provider) {
				return icons('provider', provider.name);
			}
		}
	}
</script>