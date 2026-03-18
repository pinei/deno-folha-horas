<template>
	<div id="select-kanban-card" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">Selecionar Issue</div>
	  <div class="content">
		<div v-if="state.loading" class="ui active centered inline loader"></div>
		<div v-else-if="state.cards.length === 0">
			<p>Nenhuma issue disponível</p>
		</div>
		<div v-else class="ui relaxed divided selection list">
			<div
				v-for="card in state.cards" :key="card.id"
				class="item"
				:class="{ active: state.selectedCard?.id === card.id }"
				@click="selectCard(card)"
				style="cursor: pointer;">
				<div class="content">
					<div class="header">
						{{ card.issue }}
					</div>
					<div class="description" style="margin-bottom: 1em; margin-top: 0.5em;">
						<p v-for="(line, index) in parseDescription(card.description)" :key="'d'+index">
							<span v-html="line"></span>
						</p>
						<p v-for="(line, index) in parseLines(card.relevantFacts)" :key="'rf'+index" class="ui blue" data-tooltip="Fato Relevante" data-position="top left">
							<i class="circle exclamation icon"></i>{{ line }}
						</p>
						<p v-for="(line, index) in parseLines(card.deliveries)" :key="'dl'+index" class="ui green" data-tooltip="Entrega" data-position="top left">
							<i class="cube icon"></i>{{ line }}
						</p>
					</div>
				</div>
			</div>
		</div>
	  </div>
	  <div class="actions">
		<div class="ui cancel button" @click="close">Cancelar</div>
		<div class="ui primary ok button" :class="{ disabled: !state.selectedCard }" @click="confirm">OK</div>
	  </div>
	</div>
</template>

<script setup>
import { reactive, watch, onMounted, onUnmounted } from 'vue';
import kanbanApi from '../services/kanban-api.mjs';
import { useParseDescription } from '../composables/useParseDescription.mjs';

const { parseDescription } = useParseDescription();

const log = (message, object) => {
	if (object)
		console.log(`[SelectKanbanCard] ${message}`, object)
	else
		console.log(`[SelectKanbanCard] ${message}`)
}

/* Properties */

const props = defineProps({
  visible: {
	type: Boolean,
	required: true,
  }
});

/* State */

const state = reactive({
	cards: [],
	selectedCard: null,
	loading: false,
	isModalVisible: false,
});

/* Methods */

async function loadAvailableCards() {
	state.loading = true
	try {
		state.cards = await kanbanApi.getAvailableKanbanCards()
	} catch (err) {
		console.error('Error loading available cards:', err)
		state.cards = []
	} finally {
		state.loading = false
	}
}

function selectCard(card) {
	state.selectedCard = card
	log('Selected card:', card)
}

function parseLines(text) {
	if (!text || text.trim() === '') return []
	return text.split('\n').filter(line => line.trim() !== '')
}

/* Events */

const emits = defineEmits(['select', 'close'])

function confirm() {
	if (state.selectedCard) {
		log('Confirming selection:', state.selectedCard)
		emits('select', state.selectedCard)
	}
}

function close() {
	log('Closing...')
	emits('close')
}

/* Watches */

watch(() => props.visible, (newValue) => {
	log(`Modal visible changed: ${newValue}`)

	if (newValue === true) {
		state.selectedCard = null
		loadAvailableCards()
		if (!state.isModalVisible)
			$('#select-kanban-card').modal('show');
	} else {
		if (state.isModalVisible)
			$('#select-kanban-card').modal('hide');
	}
});

/* Lifecycle */

const clearDOM = () => {
    log('Clearing DOM...')
    $('.ui.dimmer.modals').remove()
}

onMounted(() => {
	log('Mounted...')

	const modalOptions = {
		onShow: () => {
			state.isModalVisible = true;
		},
		onHidden: () => {
			state.isModalVisible = false;
			emits('close');
		}
	};

	$('#select-kanban-card').modal(modalOptions);
});

onUnmounted(() => {
	log('Unmounted...')
	clearDOM()
});
</script>

<style scoped>
#select-kanban-card .ui.selection.list .item.active {
	background-color: #e8f4fd;
	border-left: 3px solid #2185d0;
	font-weight: bold;
}

#select-kanban-card .ui.selection.list .item:hover {
	background-color: #f0f0f0;
}

#select-kanban-card p.ui.blue {
    color: rgb(0, 0, 128);
}

#select-kanban-card p.ui.green {
    color: rgb(0, 64, 0);
}

#select-kanban-card .ui.selection.list .item .description p {
    margin: 0 0 0.5em;
}

#select-kanban-card .ui.selection.list .item .description p:last-child {
    margin-bottom: 0;
}
</style>
