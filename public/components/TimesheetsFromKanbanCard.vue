<template>
	<div v-if="!timesheets || timesheets.length === 0" class="ui message">
		<p>No timesheet associated.</p>
	</div>

	<div v-else class="ui fluid cards timesheet-cards-list">
		<div v-for="(ts, index) in timesheets" :key="index"
			class="ui fluid card timesheet-card-item"
			:class="{ 'editing': editingIndex === index, 'consulting': editingIndex !== index }"
			@click="editingIndex !== index ? startEditing(index) : undefined">
			<!-- Consult Mode -->
			<template v-if="editingIndex !== index">
				<div class="content">
					<h5>
						{{ ts.context || '(No context)' }}
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
			</template>

			<!-- Edit Mode -->
			<form v-else class="content ui form" style="overflow: hidden;">
				<div class="fields">
					<div class="four wide field" :class="isTsValidDate(ts) || 'error'">
						<label>Date</label>
						<div class="ui calendar" :id="'ts-calendar-' + index">
							<div class="ui input left icon">
								<i class="calendar icon"></i>
								<input type="text" placeholder="Date" :name="'date-' + index">
							</div>
						</div>
					</div>
					<div class="four wide field" :class="isTsValidTimeSpent(ts) || 'error'">
						<label>Effort (HH)</label>
						<input type="text" placeholder="0.5" v-model="ts.timeSpent">
					</div>
					<div class="eight wide field" :class="isTsValidCategory(ts) || 'error'">
						<label>Category</label>
						<CategoryDropdown
							v-model="ts.category" :categories="categories" :enabled="isModalVisible"></CategoryDropdown>
					</div>
				</div>
				<div class="field">
					<label>Context</label>
					<input type="text" v-model="ts.context">
				</div>
				<div class="field" :class="isTsValidDescription(ts) || 'error'">
					<label>Description</label>
					<textarea rows="2" v-model="ts.description" @paste="handlePaste($event, ts, 'description')"></textarea>
				</div>
				
				<div style="margin-top: 1em; display: flex; justify-content: flex-end; gap: 0.5em;">
					<button class="ui mini red circular icon button" type="button" data-tooltip="Remove Timesheet" data-position="top right" @click.stop="removeTimesheet(index)">
						<i class="trash icon"></i>
					</button>
					<button class="ui mini green circular icon button" type="button" data-tooltip="Done" data-position="top right" @click.stop="stopEditing()">
						<i class="checkmark icon"></i>
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Add Button -->
	<div class="ui divider" v-if="timesheets && timesheets.length > 0"></div>
	<button class="ui mini primary circular icon button" type="button" data-tooltip="Add Timesheet" data-position="right center" @click="$emit('add-timesheet')" style="margin-top: 1em;">
		<i class="plus icon"></i>
	</button>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import { useParseDescription } from '../composables/useParseDescription.mjs';
import { useCategoryStore } from '../stores/category-store.mjs';
import CategoryDropdown from './CategoryDropdown.vue';
import { usePaste } from '../composables/usePaste.mjs';

const { parseDescription } = useParseDescription();
const categoryStore = useCategoryStore();
const { handlePaste } = usePaste();

const props = defineProps({
	timesheets: {
		type: Array,
		required: true
	},
	categories: {
		type: Array,
		required: true
	},
	isModalVisible: {
		type: Boolean,
		required: true
	}
});

const emits = defineEmits(['remove-timesheet', 'add-timesheet']);

const editingIndex = ref(null);
let lastLength = 0;

const categoryClass = (value) => {
	return categoryStore.getCategoryColor(value);
}

const startEditing = (index) => {
	editingIndex.value = index;
	setTimeout(() => {
		initTimesheetCalendar(index);
	}, 50);
}

const stopEditing = () => {
	editingIndex.value = null;
}

const removeTimesheet = (index) => {
	if (editingIndex.value === index) {
		editingIndex.value = null;
	}
	emits('remove-timesheet', index);
}

/* Validation Helpers */
const isTsValidDate = (ts) => {
	return ts?.date && /^(\d{4})-(\d{2})-(\d{2})$/.test(ts.date) && !isNaN(new Date(ts.date).getTime());
}

const isTsValidTimeSpent = (ts) => {
	return typeof(ts?.timeSpent) === 'number' || (ts?.timeSpent?.toString().trim().length > 0 && parseFloat(ts?.timeSpent) > 0);
}

const isTsValidCategory = (ts) => {
	return ts?.category?.trim().length > 0;
}

const isTsValidDescription = (ts) => {
	return ts?.description?.trim().length > 0;
}

/* Calendar Initialization */
const initTimesheetCalendar = (index) => {
	const calendarOptions = {
		type: 'date',
		today: true,
		formatter: {
			date: (date, settings) => {
				if (!date) return '';
				const day = date.getDate();
				const month = date.getMonth() + 1;
				const year = date.getFullYear();
				return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			}
		},
		onChange: (date, text, mode) => {
			if (date && props.timesheets[index]) {
				props.timesheets[index].date = date.toISOString().substring(0, 10);
			}
		}
	};

	$(`#ts-calendar-${index}`).calendar(calendarOptions);

	// Set existing date value
	const ts = props.timesheets[index];
	if (ts && ts.date) {
		const localDate = ts.date.replace(/-/g, '/');
		const dateValue = new Date(localDate);
		$(`#ts-calendar-${index}`).calendar('set date', dateValue, true, false);
	}
}

/* Watches to manage edit state cleanly */
watch(() => props.timesheets, (newVal, oldVal) => {
	if (newVal !== oldVal) {
		editingIndex.value = null;
		lastLength = newVal ? newVal.length : 0;
	} else {
		const newLength = newVal ? newVal.length : 0;
		if (newLength > lastLength) {
			startEditing(newLength - 1);
		}
		lastLength = newLength;
	}
}, { deep: true, immediate: true });

watch(() => props.isModalVisible, (newVal) => {
	if (!newVal) {
		editingIndex.value = null;
	}
});
</script>

<style>
.timesheet-cards-list {
	margin-top: 1em !important;
}

.card.timesheet-card-item {
	box-shadow: 0 1px 3px 0 rgba(34, 36, 38, .12), 0 1px 2px 0 rgba(34, 36, 38, .08) !important;
	border: 1px solid rgba(34, 36, 38, .15) !important;
	border-radius: 0.28571429rem !important;
	margin-bottom: 0.75em !important;
}

.card.timesheet-card-item.editing {
	box-shadow: 0 2px 8px 0 rgba(34, 36, 38, .2), 0 2px 4px 0 rgba(34, 36, 38, .15) !important;
	border: 1px solid #2185d0 !important; /* Blue border to highlight active edit */
}

.card.timesheet-card-item.consulting {
	cursor: pointer;
}

.timesheet-card-item .description p {
	margin: 0 0 0.5em;
	line-height: 1.4;
}
</style>
