<template>
    <aside v-if="$store.state.pageName === 'providers'" class="filters">
        <div class="scroller">
            <div id="filters">
                <div class="filter" data-filter="all">All</div>
                <div class="filter" data-filter=".collaboration">Collaboration</div>
                <div class="filter" data-filter=".development">Development</div>
                <div class="filter" data-filter=".finance">Finance</div>
                <div class="filter" data-filter=".fitness">Fitness</div>
                <div class="filter" data-filter=".gaming">Gaming</div>
                <div class="filter" data-filter=".health">Health</div>
                <div class="filter" data-filter=".media">Media</div>
                <div class="filter" data-filter=".music">Music</div>
                <div class="filter" data-filter=".productivity">Productivity</div>
                <div class="filter" data-filter=".social">Social</div>
                <div class="filter" data-filter=".video">Video</div>
            </div>
        </div>
    </aside>
</template>
