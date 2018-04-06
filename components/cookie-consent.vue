<template>
	<div v-if="!$store.state.cookies.cookieconsent" class="cookie-consent">
		<div>Cookies help us deliver our services. By using our services, you agree to our use of cookies.</div>
		<div>
			<a href="https://bitscoop.com/privacy">Learn More.</a>
		</div>

		<button>Got it</button>
	</div>
</template>