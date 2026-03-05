<template>
	<div id="edit-kanban-card" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">{{ state.card.id ? `Card (id=${state.card.id})` : "Novo Card" }}</div>
	  <div class="scrolling content">
		<!-- Tabs Menu -->
		<div class="ui top attached tabular menu">
			<a class="item active" data-tab="issue-tab">Issue</a>
			<a class="item" data-tab="timesheets-tab">
				Timesheets 
				<span class="ui circular small label" v-if="state.card.timesheets && state.card.timesheets.length > 0">
					{{ state.card.timesheets.length }}
				</span>
			</a>
		</div>

		<!-- Tab 1: Issue -->
		<div class="ui bottom attached tab segment active" data-tab="issue-tab">
			<form class="ui form">
				<div class="field" :class="isValidIssue || 'error'">
					<label>Issue</label>
					<input type="text" name="issue" v-model="state.card.issue">
				</div>
				<div class="field" :class="isValidDescription || 'error'">
					<label>Descrição</label>
					<textarea name="description" rows="2" v-model="state.card.description"></textarea>
				</div>
				<div class="field">
					<label>Fatos Relevantes</label>
					<textarea name="relevantFacts" rows="2" v-model="state.card.relevantFacts"></textarea>
				</div>
				<div class="field">
					<label>Entregas</label>
					<textarea name="deliveries" rows="2" v-model="state.card.deliveries"></textarea>
				</div>
				<div class="field" v-show="state.card.status === 'DONE' && !isNewCard">
					<label>Arquivado</label>
					<div class="ui toggle checkbox" id="card-archived-checkbox">
						<input type="checkbox" name="archived" v-model="state.card.archived">
						<label></label>
					</div>
				</div>
			</form>
		</div>

		<!-- Tab 2: Timesheets -->
		<div class="ui bottom attached tab segment" data-tab="timesheets-tab">
			<div v-if="!state.card.timesheets || state.card.timesheets.length === 0" class="ui message">
				<p>Nenhum timesheet associado.</p>
			</div>

			<div v-for="(ts, index) in state.card.timesheets" :key="index">
				<div class="ui clearing divider" v-if="index > 0"></div>
				<form class="ui form" style="overflow: hidden;">
					<div class="fields">
						<div class="four wide field" :class="isTsValidDate(ts) || 'error'">
							<label>Data</label>
							<div class="ui calendar" :id="'ts-calendar-' + index">
								<div class="ui input left icon">
									<i class="calendar icon"></i>
									<input type="text" placeholder="Data" :name="'date-' + index">
								</div>
							</div>
						</div>
						<div class="four wide field" :class="isTsValidTimeSpent(ts) || 'error'">
							<label>Esforço (HH)</label>
							<input type="text" placeholder="0.5" v-model="ts.timeSpent">
						</div>
						<div class="eight wide field" :class="isTsValidCategory(ts) || 'error'">
							<label>Categoria</label>
							<CategoryDropdown
								v-model="ts.category" :categories="state.categories" :enabled="state.isModalVisible"></CategoryDropdown>
						</div>
					</div>
					<div class="field">
						<label>Contexto</label>
						<input type="text" v-model="ts.context">
					</div>
					<div class="field" :class="isTsValidDescription(ts) || 'error'">
						<label>Descrição</label>
						<textarea rows="2" v-model="ts.description"></textarea>
					</div>
					<button class="ui mini red circular icon button right floated" type="button" data-tooltip="Remover Timesheet" data-position="top right" @click="removeTimesheet(index)">
						<i class="trash icon"></i>
					</button>
				</form>
			</div>

			<div class="ui divider" v-if="state.card.timesheets && state.card.timesheets.length > 0"></div>
			<button class="ui mini primary circular icon button" type="button" data-tooltip="Adicionar Timesheet" data-position="right center" @click="addTimesheet">
				<i class="plus icon"></i>
			</button>
		</div>
	  </div>

	  <SaveCancelRemoveActions
	   :visible="visible" :disableSave="!isValidCard" :disableRemove="isNewCard"
	   @save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>

</template>

<script setup>
import { defineEmits, defineModel, computed, watch, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useCategoryStore } from '../stores/category-store.mjs';
import CategoryDropdown from './CategoryDropdown.vue';

const categoryStore = useCategoryStore();

const log = (message, object) => {
	if (object)
		console.log(`[EditKanbanCard] ${message}`, object)
	else
		console.log(`[EditKanbanCard] ${message}`)
}

/* Properties */

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  visible: {
	type: Boolean,
	required: true,
  }
});

/* Model */

const visible = defineModel('visible', { type: Boolean, required: true })

/* State */

const state = reactive({
	card: { timesheets: [] },
	isModalVisible: false,
	categories: [],
	categoriesNames: []
});

/* Methods */

const addTimesheet = () => {
	if (!state.card.timesheets) {
		state.card.timesheets = []
	}
	state.card.timesheets.push({
		date: new Date().toISOString().substring(0, 10),
		category: '',
		timeSpent: '',
		context: '',
		description: ''
	})
	// Initialize the calendar for the new timesheet after DOM update
	setTimeout(() => {
		initTimesheetCalendar(state.card.timesheets.length - 1)
	}, 100)
}

const removeTimesheet = (index) => {
	state.card.timesheets.splice(index, 1)
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
			if (date && state.card.timesheets[index]) {
				state.card.timesheets[index].date = date.toISOString().substring(0, 10);
			}
		}
	}

	$(`#ts-calendar-${index}`).calendar(calendarOptions);

	// Set existing date value
	const ts = state.card.timesheets[index]
	if (ts && ts.date) {
		const localDate = ts.date.replace(/-/g, '/');
		const dateValue = new Date(localDate)
		$(`#ts-calendar-${index}`).calendar('set date', dateValue, true, false);
	}
}

const initAllTimesheetCalendars = () => {
	if (state.card.timesheets) {
		for (let i = 0; i < state.card.timesheets.length; i++) {
			initTimesheetCalendar(i)
		}
	}
}

/* Watches */

watch(() => categoryStore.categories, (newValue) => {
	log(`Categories changed:`, newValue)

	state.categoriesNames = newValue.map(category => category.name);
	state.categories = newValue;
}, { immediate: true });

watch(() => props.item, (newValue) => {
	log(`Card changed:`, newValue)
	state.card = { ...newValue };

	if (!state.card.timesheets)
		state.card.timesheets = []

	// Sync visual state of Fomantic UI checkbox
	if (state.card.archived) {
		$('#card-archived-checkbox').checkbox('set checked');
	} else {
		$('#card-archived-checkbox').checkbox('set unchecked');
	}

	// Initialize timesheet calendars after DOM update
	setTimeout(() => {
		initAllTimesheetCalendars()
	}, 200)
});

watch(visible, (newValue) => {
	log(`Modal visible changed: ${newValue} and isModalVisible = ${state.isModalVisible}`)

	if (newValue == true) {
		if (!state.isModalVisible) {
			$('#edit-kanban-card .tabular.menu .item').tab('change tab', 'issue-tab');
			$('#edit-kanban-card').modal('show');
		}
	} else {
		if (state.isModalVisible)
			$('#edit-kanban-card').modal('hide');
	}
})

/* Computed */

const isNewCard = computed(() => {
	return state.card?.id == null;
});

const isValidDescription = computed(() => {
	return (
		state.card?.description?.trim().length > 0
	)
})

const isValidIssue = computed(() => {
	return (
		state.card?.issue?.trim().length > 0
	)
})

const isValidCard = computed(() => {
	return isValidDescription.value && isValidIssue.value && areTimesheetsValid.value;
});


/* Timesheet Validation Helpers */

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

const isTimesheetValid = (ts) => {
	return isTsValidDate(ts) && isTsValidTimeSpent(ts) && isTsValidCategory(ts) && isTsValidDescription(ts)
}

const areTimesheetsValid = computed(() => {
	const timesheets = state.card.timesheets || []
	return timesheets.every(ts => isTimesheetValid(ts))
})

/* Events */

const emits = defineEmits(['save', 'remove', 'close', 'clone'])

const save = () => {
	if (isValidCard.value) {
		log('Saving...')
		emits('save', state.card);
	}
	else {
		log('Card is not valid')
	}
};

const remove = () => {
	log('Removing...')
	emits('remove', state.card);
};

const close = () => {
	log('Closing...')
	visible.value = false;
	emits('close', state.card);
};

const clone = () => {
	log('Cloning...')
	emits('clone', state.card);
}

/* Lifecycle */

const clearDOM = () => {
    log('Clearing DOM...')

    // Elemento criado pela biblioteca Fomantic UI para a modal
    // causa problema no reuso em múltiplos paineis
    $('.ui.dimmer.modals').remove()
}

onMounted(async () => {
	log('Mounted...')

	await categoryStore.loadCategories();

	const modalOptions = {
		onShow: () => {
			state.isModalVisible = true;
		},
		onHidden: () => {
			log('Closing...')
			state.isModalVisible = false;
			visible.value = false; // Sync the v-model with the parent
			emits('close', state.card);
		}
	};

	$('#edit-kanban-card').modal(modalOptions);

	// Initialize tabs
	$('#edit-kanban-card .tabular.menu .item').tab();

	// Initialize archived checkbox
	$('#card-archived-checkbox').checkbox({
		onChange: function() {
			state.card.archived = $(this).is(':checked');
		}
	});
});

onUnmounted(() => {
	log('Unmounted...')
	clearDOM()
});

</script>

<style>
.ui.form textarea {
	height: 7em;
    line-height: 1.5em;
}
</style>