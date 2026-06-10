<template>
	<div class="ui fluid cards timesheet-cards-list">
		<div v-for="(ts, index) in timesheets" :key="index" class="ui fluid card timesheet-consult-card">
			<div class="content">
				<h5>
					{{ ts.context }}
					<span class="right floated" v-if="ts.date" style="color: rgba(0, 0, 0, 0.4);">
						<i class="calendar alternate outline icon"></i> {{ ts.date }}
					</span>
				</h5>
				<div class="description" style="margin-top: 0.5em;">
					<p v-for="(line, lineIdx) in parseDescription(ts.description)" :key="lineIdx">
						<span v-html="line"></span>
					</p>
				</div>
			</div>
			<div class="extra content" v-if="ts.category || ts.timeSpent">
				<span class="ui label" :class="categoryClass(ts.category)" v-if="ts.category">{{ ts.category }}</span>
				<span class="ui circular label olive inverted large right floated" v-if="ts.timeSpent">
					{{ ts.timeSpent }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useParseDescription } from '../composables/useParseDescription.mjs';
import { useCategoryStore } from '../stores/category-store.mjs';

const { parseDescription } = useParseDescription();
const categoryStore = useCategoryStore();

defineProps({
	timesheets: {
		type: Array,
		required: true
	}
});

function categoryClass(value) {
	return categoryStore.getCategoryColor(value);
}
</script>

<style>
.timesheet-cards-list {
	margin-top: 1em !important;
}

.card.timesheet-consult-card {
	box-shadow: 0 1px 3px 0 rgba(34, 36, 38, .12), 0 1px 2px 0 rgba(34, 36, 38, .08) !important;
	border: 1px solid rgba(34, 36, 38, .15) !important;
	border-radius: 0.28571429rem !important;
	margin-top: 0.75em !important;
	margin-bottom: 0.75em !important;
}


.timesheet-consult-card .description p {
	margin: 0 0 0.5em;
	line-height: 1.4;
}
</style>
