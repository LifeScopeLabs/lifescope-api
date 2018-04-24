<template>
	<div class="object contact" v-bind:id="contact.id">
		<div>
			<div class="user-avatar">
				<img v-if="contact.avatar_url" class="avatar" v-bind:src="avatar_url" />

				<i v-else class="fa fa-user"></i>
			</div>

			<div class="details flex-grow">
				<div v-if="contact.name">{{ contact.name }}</div>

				<div v-if="contact.handle">{{ contact.handle }}</div>

			</div>

			<div class="provider">
				<i v-bind=class="getProviderIcon(provider)"></i>
				<span>{{ connection.name | truncate(30) }}</span>
			</div>

			<aside class="action-bar"></aside>
		</div>
		<div>
			<div class="tagging">
				<div class="tags">
					<span v-for="tag in tags">#{{ tag }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import icons from '../../lib/util/icons';

	export default {
		data: function() {
			return {
				tags: function() {
					let tags = [];

					if (this.content.tagMasks) {
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
		filters: {
			safe: function(input) {
				return typeof input === 'string' ? input : input == null ? '' : input.toString()
			}
		},
		methods: {
			getContentTypeIcon: function(type) {
				console.log(type);
				return icons('content', type)
			},
			getProviderIcon: function(provider) {
				return icons('provider', provider.name);
			}
		},
		props: [
			'connection',
			'content'
		]
	}
</script>