<template>
	<div class="object content" v-bind:id="content.id">
		<div class="header">
			<div class="type">
				<i v-bind:class="getContentTypeIcon(content.type)"></i>
				{{ content.type }}
			</div>

			<div class="provider">
				<i v-bind:class="getProviderIcon(connection.provider)"></i> {{ connection.name | truncate(30) }}
			</div>

			<aside class="action-bar">
				<span>Tag</span><i class="fa fa-hashtag"></i>
				<span>Share</span><i class="fa fa-share"></i>
			</aside>
		</div>

		<div class="content-embed" data-type="content" v-bind:data-id="content.id"></div>

		<div v-if="content.embed_thumbnail" class="thumbnail">
			<img v-if="content.title == null" v-bind:src="content.embed_thumbnail"/>

			<a v-else v-bind:href="content.url" target="_blank">
				<img v-bind:src="content.embed_thumbnail"/>
			</a>
		</div>

		<div class="title">
			<a v-if="content.url != null" v-bind:href="content.url" target="_blank">{{ content.title | safe }}</a>
			<span v-else>{{ content.title | safe }}</span>
		</div>

		<div v-if="content.text != null" class="text">
		<!--{% if text_truncated %}-->
			<!--<a v-if="content.url && content.title == null" class="truncated" href="{{ url }}" target="_blank">{{ text_truncated | safe }}</a>-->
		<!--{% endif %}-->
		<a v-if="content.url && content.title == null" class="full" v-bind:href="content.url" target="_blank">{{ content.text | safe }}</a>

		<!--{% if text_truncated %}-->
			<!--<pre class="truncated">{{ text_truncated | safe }}</pre>-->
		<!--{% endif %}-->
		<pre v-else class="full">{{ content.text | safe }}</pre>
			<!--<div class="expand">More</div>-->
		</div>

		<div class="tagging">
			<div class="tags">
				<span v-for="tag in tags">#{{ tag }}</span>
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