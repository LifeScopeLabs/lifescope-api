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
                    <div id="searches"></div>
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
    import connectionCount from '../../apollo/queries/connectionCount.gql';
    import eventCount from '../../apollo/queries/eventCount.gql';
    import searchCount from '../../apollo/queries/searchCount.gql';

    export default {
    	data: function() {
    		return {
			    connectionCount: null,
			    eventCount: null,
			    searchCount: null
		    };
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
        }
    }
</script>