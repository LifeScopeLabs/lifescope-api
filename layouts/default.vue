<template>
    <div>
        <vue-header></vue-header>

        <aside id="menu">
            <section class="scroller">
                <div class="menu">
                    <!--<vue-menu></vue-menu>-->
                </div>
            </section>
        </aside>

        <!--<vue-aside></vue-aside>-->

        <main>
            <section id="content" class="scroller">
                <!--<vue-content></vue-content>-->
            </section>
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

    export default {
	    components: {
            CookieConsent: CookieConsent,
            VueHeader: VueHeader
	    }
    }
</script>