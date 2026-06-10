<template>
	<div v-for="(ts, index) in timesheets" :key="index">
		<div class="ui clearing divider" v-if="index > 0"></div>
		<form class="ui form" style="overflow: hidden;">
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
			<button class="ui mini red circular icon button right floated" type="button" data-tooltip="Remove Timesheet" data-position="top right" @click="removeTimesheet(index)">
				<i class="trash icon"></i>
			</button>
		</form>
	</div>

	<div class="ui divider" v-if="timesheets && timesheets.length > 0"></div>
	<button class="ui mini primary circular icon button" type="button" data-tooltip="Add Timesheet" data-position="right center" @click="$emit('add-timesheet')">
		<i class="plus icon"></i>
	</button>
</template>

<script setup>
import { defineProps, defineEmits, defineExpose } from 'vue';
import CategoryDropdown from './CategoryDropdown.vue';
import { usePaste } from '../composables/usePaste.mjs';

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

const { handlePaste } = usePaste();

const isTsValidDate = (ts) => {
	return ts?.date && /^(\d{4})-(\d{2})-(\d{2})$/.test(ts.date) && !isNaN(new Date(ts.date).getTime())
}

const isTsValidTimeSpent = (ts) => {
	return typeof(ts?.timeSpent) === 'number' || (ts?.timeSpent?.toString().trim().length > 0 && parseFloat(ts?.timeSpent) > 0)
}

const isTsValidCategory = (ts) => {
	return ts?.category?.trim().length > 0
}

const isTsValidDescription = (ts) => {
	return ts?.description?.trim().length > 0
}

const removeTimesheet = (index) => {
	emits('remove-timesheet', index);
}

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
	}

	$(`#ts-calendar-${index}`).calendar(calendarOptions);

	// Set existing date value
	const ts = props.timesheets[index]
	if (ts && ts.date) {
		const localDate = ts.date.replace(/-/g, '/');
		const dateValue = new Date(localDate)
		$(`#ts-calendar-${index}`).calendar('set date', dateValue, true, false);
	}
}

const initAllTimesheetCalendars = () => {
	if (props.timesheets) {
		for (let i = 0; i < props.timesheets.length; i++) {
			initTimesheetCalendar(i)
		}
	}
}

defineExpose({
	initTimesheetCalendar,
	initAllTimesheetCalendars
});

</script>