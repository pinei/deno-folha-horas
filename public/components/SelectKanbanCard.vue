<template>
	<div id="select-kanban-card" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">Selecionar Issue</div>
	  <div class="scrolling content">
		<div v-if="state.loading" class="ui active centered inline loader"></div>
		<div v-else-if="state.cards.length === 0">
			<p>Nenhuma issue disponível</p>
		</div>
		<div v-else>
			<div class="ui cards" v-if="state.candidateCards.length > 0">
				<KanbanCard
					v-for="card in state.candidateCards" :key="card.id"
					:card="card"
					:simple="true"
					:class="{ active: state.selectedCard?.id === card.id }"
					@click="selectCard(card)" />
			</div>

			<div v-if="state.otherCards.length > 0 && !state.showOtherCards" style="text-align: center; margin-top: 1em; margin-bottom: 1em;">
				<button class="ui basic button" @click="state.showOtherCards = true">Others</button>
			</div>

			<div class="ui cards" v-if="state.showOtherCards && state.otherCards.length > 0" :style="state.candidateCards.length > 0 ? 'margin-top: 1em;' : ''">
				<KanbanCard
					v-for="card in state.otherCards" :key="card.id"
					:card="card"
					:simple="true"
					:class="{ active: state.selectedCard?.id === card.id }"
					@click="selectCard(card)" />
			</div>
		</div>
	  </div>
	  <div class="actions">
		<div class="ui secondary left floated button" @click="close">Cancelar</div>
		<div class="ui primary right labeled icon button" :class="{ disabled: !state.selectedCard }" @click="confirm">Salvar <i class="checkmark icon"></i></div>
	  </div>
	</div>
</template>

<script setup>
import { reactive, watch, onMounted, onUnmounted } from 'vue';
import kanbanApi from '../services/kanban-api.mjs';
import KanbanCard from '../components/KanbanCard.vue';

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
  },
  category: {
	type: String,
	required: false
  }
});

/* State */

const state = reactive({
	cards: [],
	candidateCards: [],
	otherCards: [],
	selectedCard: null,
	loading: false,
	isModalVisible: false,
	showOtherCards: false,
});

/* Methods */

async function loadAvailableCards() {
	state.loading = true
	state.showOtherCards = false
	try {
		state.cards = await kanbanApi.getAvailableKanbanCards()
		
		const isCandidate = (card) => {
			const ts = card.timesheets || []
			const hasNoCategory = ts.length === 0 || ts.every(t => !t.category)
			
			if (props.category) {
				const hasMatchingCategory = ts.some(t => t.category === props.category)
				return hasMatchingCategory || hasNoCategory
			} else {
				return hasNoCategory
			}
		}

		state.candidateCards = state.cards.filter(card => isCandidate(card))
		state.otherCards = state.cards.filter(card => !isCandidate(card))
		log(`Candidate cards:`, state.candidateCards)
	} catch (err) {
		console.error('Error loading available cards:', err)
		state.cards = []
		state.candidateCards = []
		state.otherCards = []
	} finally {
		state.loading = false
	}
}

function selectCard(card) {
	state.selectedCard = card
	log('Selected card:', card)
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
#select-kanban-card .card.kanban-card {
	width: calc(50% - 2em);
	min-width: 250px;
	box-shadow: 0 1px 3px 0 #d4d4d5;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	cursor: pointer;
	margin: 1em;
	border: 2px solid transparent;
}

#select-kanban-card .card.kanban-card:hover {
	transform: translateY(-4px);
    box-shadow: 0 4px 8px 0 rgba(34, 36, 38, .12), 0 2px 4px 0 rgba(34, 36, 38, .08);
}

#select-kanban-card .card.kanban-card.active {
	border: 2px solid #2185d0;
	box-shadow: 0 0 10px rgba(33, 133, 208, 0.5);
    background-color: #f7fbff;
}

#select-kanban-card p.ui.blue {
    color: rgb(0, 0, 128);
}

#select-kanban-card p.ui.green {
    color: rgb(0, 64, 0);
}

#select-kanban-card .card > .content p {
    margin: 0 0 0.5em;
}

#select-kanban-card .card > .content p:last-child {
    margin-bottom: 0;
}
</style>
