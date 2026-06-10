<template>
	<div id="edit-kanban-card" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">{{ state.card.id ? `Card (id=${state.card.id})` : "New Card" }}</div>
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
				<div class="field">
					<label>Campaign</label>
					<select class="ui dropdown" name="campaignId" v-model="state.card.campaignId" id="card-campaign-dropdown">
						<option :value="null">-</option>
						<option v-for="camp in campaignStore.campaigns" :key="camp.id" :value="camp.id">
							{{ camp.name }}
						</option>
					</select>
				</div>
				<div class="field" :class="isValidIssue || 'error'">
					<label>Issue</label>
					<input type="text" name="issue" v-model="state.card.issue">
				</div>
				<div class="field" :class="isValidDescription || 'error'">
					<label>Description</label>
					<textarea name="description" rows="2" v-model="state.card.description" @paste="handlePaste($event, state.card, 'description')"></textarea>
				</div>
				<div class="field">
					<label>Relevant Facts</label>
					<textarea name="relevantFacts" rows="2" v-model="state.card.relevantFacts"></textarea>
				</div>
				<div class="field">
					<label>Deliveries</label>
					<textarea name="deliveries" rows="2" v-model="state.card.deliveries"></textarea>
				</div>
				<div class="field" v-show="state.card.status === 'DONE' && !isNewCard">
					<label>Archived</label>
					<div class="ui toggle checkbox" id="card-archived-checkbox">
						<input type="checkbox" name="archived" v-model="state.card.archived">
						<label></label>
					</div>
				</div>
			</form>
		</div>

		<!-- Tab 2: Timesheets -->
		<div class="ui bottom attached tab segment" data-tab="timesheets-tab">
			<TimesheetsFromKanbanCard
				:timesheets="state.card.timesheets"
				:categories="state.categories"
				:isModalVisible="state.isModalVisible"
				@remove-timesheet="removeTimesheet"
				@add-timesheet="addTimesheet"
			></TimesheetsFromKanbanCard>
		</div>
	  </div>

	  <SaveCancelRemoveActions
	   :visible="visible" :disableSave="!isValidCard || (!state.card.isEdited && !isNewCard)" :disableRemove="isNewCard"
	   @save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>

</template>

<script setup>
import { defineEmits, defineModel, computed, watch, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useCategoryStore } from '../stores/category-store.mjs';
import { useCampaignStore } from '../stores/campaign-store.mjs';
import CategoryDropdown from './CategoryDropdown.vue';
import TimesheetsFromKanbanCard from './TimesheetsFromKanbanCard.vue';
import { usePaste } from '../composables/usePaste.mjs';

const categoryStore = useCategoryStore();
const campaignStore = useCampaignStore();
const { handlePaste } = usePaste();

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
}

const removeTimesheet = (index) => {
	state.card.timesheets.splice(index, 1)
}

/* Watches */

watch(() => categoryStore.categories, (newValue) => {
	log(`Categories changed:`, newValue)

	state.categoriesNames = newValue.map(category => category.name);
	state.categories = newValue;
}, { immediate: true });

let isInitializingCard = false;

watch(() => props.item, (newValue) => {
	log(`Card changed:`, newValue)
	isInitializingCard = true;
	state.card = JSON.parse(JSON.stringify(newValue || { timesheets: [] }));

	if (!state.card.timesheets)
		state.card.timesheets = []
	else
		state.card.timesheets.sort((a, b) => (a.date || '').localeCompare(b.date || ''))

	// Sync visual state of Fomantic UI checkbox
	if (state.card.archived) {
		$('#card-archived-checkbox').checkbox('set checked');
	} else {
		$('#card-archived-checkbox').checkbox('set unchecked');
	}

	setTimeout(() => {
		$('#card-campaign-dropdown').dropdown('set selected', state.card.campaignId || null);
	}, 100);

	setTimeout(() => {
		isInitializingCard = false;
	}, 300);
});

watch(() => state.card, (newValue) => {
	if (!isInitializingCard && !state.card.isEdited) {
		log('Card modified in memory, setting isEdited = true');
		state.card.isEdited = true;
	}
}, { deep: true });

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
		state.card.isEdited = false;
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
	if (campaignStore.campaigns.length === 0) {
		await campaignStore.loadCampaignsList();
	}

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

	$('#card-campaign-dropdown').dropdown({
		onChange: function(value) {
			// Convert string value to number if it's not null/empty
			state.card.campaignId = value ? Number(value) : null;
		}
	});

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