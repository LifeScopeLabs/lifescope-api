<template>
</template>

<script>
    export default {
    	middleware: function({ redirect }) {
    		return redirect('/settings/connections');
        }
    }
</script>