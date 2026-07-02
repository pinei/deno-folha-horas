<template>
	<div id="edit-timesheet" class="ui modal" :class="{ inverted: themeStore.isDark }">
	  <i class="close icon"></i>
	  <div class="header">{{ state.record.id ? `Timesheet (id=${state.record.id})` : "New Timesheet" }}</div>
	  <div class="content">
		<!-- Tab menu -->
		<div class="ui top attached tabular menu" :class="{ inverted: themeStore.isDark }">
			<a class="item active" data-tab="timesheet">Timesheet</a>
			<a class="item" data-tab="issue" v-if="state.record.kanbanCard">Issue</a>
		</div>

		<!-- Timesheet tab -->
		<div class="ui bottom attached tab segment active" :class="{ inverted: themeStore.isDark }" data-tab="timesheet">
		<form class="ui form" :class="{ inverted: themeStore.isDark }">
		<div class="fields">
			<div class="four wide field" :class="isValidDate || 'error'">
				<label>Data</label>
				<div class="ui calendar" :class="{ inverted: themeStore.isDark }">
					<div class="ui input left icon" :class="{ inverted: themeStore.isDark }">
						<i class="calendar icon" :class="{ inverted: themeStore.isDark }"></i>
						<input type="text" placeholder="Select a date" name="date">
					</div>
				</div>
			</div>
			<div class="four wide field" :class="isValidTimeSpent || 'error'">
				<label>Effort (HH)</label>
				<input type="text" name="timeSpent" placeholder="0.5" v-model="state.record.timeSpent">
			</div>
			<div class="eight wide field" :class="isValidCategory || 'error'">
				<label>Category</label>
				<CategoryDropdown
					v-model="state.record.category" :categories="state.categories" :enabled="state.isModalVisible"></CategoryDropdown>
			</div>
		</div>
		<div class="field" :class="isValidContext || 'error'">
			<label>Context</label>
			<input type="text" name="context" v-model="state.record.context">
		</div>
		<div class="field" :class="isValidDescription || 'error'">
			<label>Description</label>
			<textarea name="description" rows="2" v-model="state.record.description" @paste="handlePaste($event, state.record, 'description')"></textarea>
		</div>
		</form>
		</div>

		<!-- Issue tab -->
		<div class="ui bottom attached tab segment" :class="{ inverted: themeStore.isDark }" data-tab="issue" v-if="state.record.kanbanCard">
		<form class="ui form" :class="{ inverted: themeStore.isDark }">
			<div class="field">
				<label>Issue</label>
				<input type="text" readonly :value="state.record.kanbanCard.issue">
			</div>
			<div class="field">
				<label>Description</label>
				<textarea rows="2" readonly :value="state.record.kanbanCard.description"></textarea>
			</div>
			<div class="field">
				<label>Relevant Facts</label>
				<textarea rows="2" readonly :value="state.record.kanbanCard.relevantFacts"></textarea>
			</div>
			<div class="field">
				<label>Deliveries</label>
				<textarea rows="2" readonly :value="state.record.kanbanCard.deliveries"></textarea>
			</div>
			<div class="ui divider"></div>
			<button type="button" class="ui red basic button" :class="{ inverted: themeStore.isDark }" @click="unlinkIssue">
				<i class="unlink icon"></i> Unlink
			</button>
		</form>
		</div>
	  </div>

	  <SaveCancelRemoveActions
	   :visible="state.isModalVisible" :disableSave="!isValidRecord" :disableRemove="isNewRecord"
	   @save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>

</template>

<script setup>
import { defineEmits, computed, watch, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useCategoryStore } from '../stores/category-store.mjs';
import CategoryDropdown from './CategoryDropdown.vue';
import { usePaste } from '../composables/usePaste.mjs';
import { useThemeStore } from '../stores/theme-store.mjs';
import { useValidateRecord } from '../composables/useValidateRecord.mjs';

const categoryStore = useCategoryStore();
const { handlePaste } = usePaste();
const themeStore = useThemeStore();
const { isTsValidDate, isTsValidTimeSpent, isTsValidCategory, isTsValidDescription } = useValidateRecord();

const log = (message, object) => {
	if (object)
		console.log(`[EditRecord] ${message}`, object)
	else
		console.log(`[EditRecord] ${message}`)
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

/* State */

const state = reactive({
	record: {},
	isModalVisible: false,
	categories: [],
	categoriesNames: []
});

/* Methods */

const setCalendar = (date) => {
	if (date) {
		const localDate = date.replace(/-/g, '/'); // https://codeofmatt.com/javascript-date-parsing-changes-in-es6/
		const dateValue = new Date(localDate)
		
		$('#edit-timesheet .ui.calendar').calendar('set date', dateValue, true, false);
		$('#edit-timesheet .ui.calendar').blur();
	}
}

/* Watches */

watch(() => categoryStore.categories, (newValue) => {
	log(`Categories changed:`, newValue)

	state.categoriesNames = newValue.map(category => category.name);
	state.categories = newValue;
}, { immediate: true });

watch(() => props.item, (newValue) => {
	log(`Record changed:`, newValue)
	state.record = {...newValue};

	if (state.record.date)
		setCalendar(state.record.date);
});

watch(() => props.visible, (newValue) => {
	log(`Modal visible changed: ${newValue} and isModalVisible = ${state.isModalVisible}`)

	if (newValue == true) {
		if (!state.isModalVisible)
			$('#edit-timesheet').modal('show');
	} else {
		if (state.isModalVisible)
			$('#edit-timesheet').modal('hide');
	}
});

/* Copmputed */

const isNewRecord = computed(() => {
	return state.record?.id == null;
});

const isValidDate = computed(() => {
	return isTsValidDate(state.record);
})

const isValidTimeSpent = computed(() => {
	return isTsValidTimeSpent(state.record);
})

const isValidCategory = computed(() => {
	return isTsValidCategory(state.record);
})

const isValidContext = computed(() => {
	return true
})

const isValidDescription = computed(() => {
	return isTsValidDescription(state.record);
})

const isValidRecord = computed(() => {
	return isValidCategory.value && isValidDescription.value && isValidDate.value && isValidTimeSpent.value && isValidContext;
});


/* Events */

const emits = defineEmits(['save', 'remove', 'close', 'clone'])

const save = () => {
	if (isValidRecord.value) {
		log('Saving...')
		emits('save', state.record);
	}
	else {
		log('Record is not valid')
	}
};

const remove = () => {
	log('Removing...')
	emits('remove', state.record);
};

const close = () => {
	log('Closing...')
	emits('close', state.record);
};

const clone = () => {
	log('Cloning...')
	emits('clone', state.record);
}

const unlinkIssue = () => {
	log('Unlinking Issue...')
	state.record.kanbanCard = null;
	$('#edit-timesheet .tabular.menu .item').tab('change tab', 'timesheet');
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
			// Re-initialize tabs when modal opens, waiting for Vue DOM updates
			setTimeout(() => {
				$('#edit-timesheet .tabular.menu .item').tab();
			}, 50);
		},
		onHidden: () => {
			state.isModalVisible = false;
			emits('close', state.record);
		}
	};

	$('#edit-timesheet').modal(modalOptions);

	// Initialize Fomantic UI tabs
	$('#edit-timesheet .tabular.menu .item').tab();

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
			if (date) {
				log(`Calendar changed: ${date} (text: ${text}, mode: ${mode})`)
				state.record.date = date.toISOString().substring(0, 10);
				log(`:. record.date = ${state.record.date}`)
			}
		}
	}

	// Inicialização do componente de calendário
	$('#edit-timesheet .ui.calendar').calendar(calendarOptions);
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