<template>
    <main>
        <aside v-if="$store.state.user != undefined" id="profile">
            <div class="avatar">
                <a href="https://app.lifescope.io/settings/profile">
                    <i class="fa fa-user"></i>
                </a>
            </div>

            <div class="divider"></div>

            <div class="info">
                <div>
                    <i class="fa fa-clock-o"></i>
                    <span>Joined {{ $store.getters.dateJoined }}</span>
                </div>
            </div>

            <div class="divider"></div>

            <div class="stats">
                <a class="connections" href="/settings/connections">
                    <div class="count" v-model="connectionCount">{{ connectionCount }}</div>
                    <div class="label">Connections</div>
                </a>

                <a class="events" href="/explore">
                    <div class="count" v-model="eventCount">{{ eventCount }}</div>
                    <div class="label">Events</div>
                </a>

                <a class="searches" href="/explore">
                    <div class="count" v-model="searchCount">{{ searchCount }}</div>
                    <div class="label">Searches</div>
                </a>
            </div>
        </aside>

        <section v-if="$store.state.user != undefined"  id="content">
            <nav id="tabs">
                <div class="tab" name="favorites">Favorites</div>
                <div class="tab" name="recent">Recent</div>
                <div class="tab" name="top">Top</div>
                <div class="tab" name="tags">Tags</div>
            </nav>

            <div id="search-container">
                <div class="scroller">
                    <div id="searches">
                        <a v-model="searchMany" v-for="search in searchMany" href="/explore"
                           class="saved-search"
                           v-bind:data-id="search.id"
                           v-bind:data-favorited="search.favorited"
                           v-bind:data-icon-color="search.iconColor"
                           v-bind:data-icon="search.icon"
                           v-bind:data-name="search.name">

                            <div class="info">
                                <i v-bind:class="searchIcon(search)" v-bind:style="{ color: searchColor(search) }"></i>
                                <span class="name">{{ search.name }}</span>

                                <span class="spacer"></span>

                                <span class="last-run">{{ lastRunRelative(search) }}</span>

                                <i v-bind:class="favoriteIcon(search)"></i>
                            </div>

                            <div v-if="search.query || (search.filters && search.filters.length > 0)" class="search">
                                <div v-if="search.query" class="query">&quot;{{ query }}&quot;</div>

                                <div v-if="search.filters && search.filters.length > 0" class="filters">
                                    <div v-for="filter in search.filters" class="filter">{{ search.filter.name || search.filter.type }}</div>

                                    <div class="filter-overflow-count"></div>
                                </div>
                            </div>

                            <div v-bind:class="favoriteButton(search)"></div>
                        </a>

                    </div>
                </div>
            </div>
        </section>

        <aside v-if="$store.state.user != undefined" id="favorite" class="modal modal-close">
            <div class="container">
                <div class="scroller">
                    <div class="content">
                        <i class="modal-close close-button"></i>

                        <div class="body"></div>
                    </div>
                </div>
            </div>
        </aside>
    </main>
</template>

<script>
    import moment from 'moment';
    import connectionCount from '../../apollo/queries/connection-count.gql';
    import eventCount from '../../apollo/queries/event-count.gql';
    import searchCount from '../../apollo/queries/search-count.gql';
    import searchAll from '../../apollo/queries/search-all.gql';

    export default {
    	data: function() {
    		return {
			    connectionCount: null,
			    eventCount: null,
			    searchCount: null,
                searches: null
		    };
        },
        methods: {
    		searchIcon: function(search) {
			    return search.favorited && search.icon ? search.icon : 'fa fa-circle-o';
            },
            searchColor: function(search) {
    			return search.favorited && search.icon && search.icon_color ? search.icon_color : '#b6bbbf';
            },
            favoriteIcon: function(search) {
	            return search.favorited ? 'favorite-edit fa fa-star subdue' : 'favorite-create fa fa-star-o subdue'
            },
            favoriteButton: function(search) {
    			return search.favorited ? 'favorite-edit' : 'favorite-create'
            },
            lastRunRelative: function(search) {
    			return moment(new Date(search.last_run)).fromNow();
            }
        },
    	apollo: {
    		connectionCount: {
                prefetch: true,
                query: connectionCount
            },
		    eventCount: {
			    prefetch: true,
			    query: eventCount
		    },
		    searchCount: {
			    prefetch: true,
			    query: searchCount
		    },
            searchMany: {
    			prefetch: true,
                query: searchAll
            }
        }
    }
</script>