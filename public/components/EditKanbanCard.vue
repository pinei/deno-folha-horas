<template>
	<div id="edit-kanban-card" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">{{ state.record.id ? `Registro (id=${state.record.id})` : "Registro" }}</div>
	  <div class="content">
		<form class="ui form">
		<div class="field" :class="isValidDate || 'error'">
			<label>Data</label>
			<div class="ui calendar">
				<div class="ui input left icon">
					<i class="calendar icon"></i>
					<input type="text" placeholder="Selecione a data" name="date">
				</div>
			</div>
		</div>
		<div class="fields">
			<div class="four wide field" :class="isValidTimeSpent || 'error'">
				<label>Esforço (HH)</label>
				<input type="text" name="timeSpent" placeholder="0.5" v-model="state.record.timesheet.timeSpent">
			</div>
			<div class="twelve wide field" :class="isValidCategory || 'error'">
				<label>Categoria</label>
				<CategoryDropdown
					v-model="state.record.timesheet.category" :categories="state.categories" :enabled="state.isModalVisible"></CategoryDropdown>
			</div>
		</div>
		<div class="field" :class="isValidIssue	|| 'error'">
			<label>Issue</label>
			<input type="text" name="issue" v-model="state.record.issue">
		</div>
		<div class="field" :class="isValidContext || 'error'">
			<label>Contexto</label>
			<input type="text" name="context" v-model="state.record.timesheet.context">
		</div>
		<div class="field" :class="isValidDescription || 'error'">
			<label>Descrição</label>
			<textarea name="description" rows="2" v-model="state.record.timesheet.description"></textarea>
		</div>
		<div class="field">
			<label>Fatos Relevantes</label>
			<textarea name="relevantFacts" rows="2" v-model="state.record.timesheet.relevantFacts"></textarea>
		</div>
		<div class="field">
			<label>Entregas</label>
			<textarea name="deliveries" rows="2" v-model="state.record.timesheet.deliveries"></textarea>
		</div>
		</form>
	  </div>

	  <SaveCancelRemoveActions
	   :visible="state.isModalVisible" :disableSave="!isValidRecord" :disableRemove="isNewRecord"
	   @save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>

</template>

<!-- @ TODO
	Refactoring com sugestão do Gemini
	https://g.co/gemini/share/2aded8b07748
-->
<script setup>
import { defineEmits, computed, watch, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useCategoryStore } from '../stores/category-store.mjs';
import CategoryDropdown from './CategoryDropdown.vue';

const categoryStore = useCategoryStore();

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
		
		$('#edit-kanban-card .ui.calendar').calendar('set date', dateValue, true, false);
		$('#edit-kanban-card .ui.calendar').blur();
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

	if (newValue?.timesheet?.date)
		setCalendar(newValue.timesheet.date);
}, { deep: true });

watch(() => props.visible, (newValue) => {
	log(`Modal visible changed: ${newValue} and isModalVisible = ${state.isModalVisible}`)

	if (newValue == true) {
		if (!state.isModalVisible)
			$('#edit-kanban-card').modal('show');
	} else {
		if (state.isModalVisible)
			$('#edit-kanban-card').modal('hide');
	}
});

/* Copmputed */

const isNewRecord = computed(() => {
	return state.record?.id == null;
});

const isValidDate = computed(() => {
	const record = state.record;
	return (
		record?.timesheet?.date
		&& /^(\d{4})-(\d{2})-(\d{2})$/.test(record.timesheet.date)
		&& !isNaN(new Date(record.timesheet.date).getTime())
	)
})

const isValidTimeSpent = computed(() => {
	const record = state.record;
	return (
		typeof(record?.timesheet?.timeSpent) === 'number' ||
		(
			record?.timesheet?.timeSpent?.trim().length > 0
			&& parseFloat(record?.timesheet?.timeSpent) > 0
		)
	)
})

const isValidCategory = computed(() => {
	return (
		state.record?.timesheet?.category?.trim().length > 0
	)
})

const isValidContext = computed(() => {
	return true
})

const isValidDescription = computed(() => {
	return (
		state.record?.timesheet?.description?.trim().length > 0
	)
})

const isValidIssue = computed(() => {
	return (
		state.record?.issue?.trim().length > 0
	)
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
			state.isModalVisible = false;
			emits('close', state.record);
		}
	};

	$('#edit-kanban-card').modal(modalOptions);

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
				state.record.timesheet.date = date.toISOString().substring(0, 10);
				log(`:. record.timesheet.date = ${state.record.timesheet.date}`)
			}
		}
	}

	// Inicialização do componente de calendário
	$('#edit-kanban-card .ui.calendar').calendar(calendarOptions);
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