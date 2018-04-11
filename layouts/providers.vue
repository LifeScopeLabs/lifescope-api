<template>
    <div id="body" v-bind:class="[{ authenticated: $store.getters.authenticated }, $store.state.pageName]">
        <vue-header></vue-header>

        <aside id="menu">
            <section class="scroller">
                <vue-menu></vue-menu>
            </section>
        </aside>

        <vue-aside></vue-aside>

        <main>
            <vue-main></vue-main>
        </main>

        <cookie-consent></cookie-consent>

        <footer>
            <!--<vue-footer></vue-footer>-->
        </footer>
    </div>
</template>

<script>
	import CookieConsent from '../components/cookie-consent';
	import VueHeader from '../components/header';
	import VueMenu from '../components/menu';
	import VueAside from '../components/aside';
	import VueMain from '../components/main/providers';

	export default {
		components: {
			CookieConsent: CookieConsent,
			VueAside: VueAside,
			VueHeader: VueHeader,
			VueMenu: VueMenu,
			VueMain: VueMain
		},
		head: {
			meta: [
				{ name: 'viewport', content: 'initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, width=device-width' },
				{ name: 'apple-mobile-web-app-capable', content: 'no'},
				{ name: 'apple-mobile-web-app-title', content: 'LifeScope'},
				{ name: 'application-name', content: 'LifeScope'},
				{ name: 'msapplication-TileColor', content: '#2ac1de' },
				{ name: 'msapplication-TileImage', content: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/mstile-144x144.png'},
				{ name: 'theme-color', content: '#ffffff'},
				{ name: 'google-site-verification', content: 'b8zInA5OFENnwrupGy0EPeJDeWvtY4e_R4SZDXZF6xI' },
				{ name: 'keywords', content: 'small data, search, data discovery, social media, LifeScope, life scope' },
				{ property: 'og:title', content: 'LifeScope' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:url', content: 'https://app.lifescope.io' },
				{ property: 'og:site_name', content: 'LifeScope' },
				{ property: 'og:description', content: 'Search & Discover the Internet of You!' },
				{ property: 'og:image:secure_url', content: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-180x180.png' }
			],
			link: [
				{ rel: 'apple-touch-icon', sizes: '57x57', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-57x57.png'},
				{ rel: 'apple-touch-icon', sizes: '60x60', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-60x69.png'},
				{ rel: 'apple-touch-icon', sizes: '72x72', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-72x72.png'},
				{ rel: 'apple-touch-icon', sizes: '76x76', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-76x76.png'},
				{ rel: 'apple-touch-icon', sizes: '114x114', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-114x114.png'},
				{ rel: 'apple-touch-icon', sizes: '120x120', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-120x120.png'},
				{ rel: 'apple-touch-icon', sizes: '144x144', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-144x144.png'},
				{ rel: 'apple-touch-icon', sizes: '152x152', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-152x152.png'},
				{ rel: 'apple-touch-icon', sizes: '180x180', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/apple-touch-icon-180x180.png'},
				{ rel: 'icon', sizes: '32x32', type: 'image/png', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/favicon-32x32.png'},
				{ rel: 'icon', sizes: '192x192', type: 'image/png', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/android-chrome-192x192.png'},
				{ rel: 'icon', sizes: '96x96', type: 'image/png', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/favicon-96x96.png'},
				{ rel: 'icon', sizes: '16x16', type: 'image/png', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/favicon-16x16.png'},
				{ rel: 'mask-icon', color: '#5bbad5', href: 'https://d233zlhvpze22y.cloudfront.net/1457056861/images/icons/safari-pinned-tab.svg' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Lato:300,400,700|PT+Sans:400,400italic,700,700italic|Quicksand:400,300|Raleway:400|Roboto:300,400,700|Source+Sans+Pro:300,400,700' },
				{ rel: 'stylesheet', href: 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css' },
			],
		}
	}
</script>