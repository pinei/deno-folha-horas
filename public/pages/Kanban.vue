<template>
    <div class="ui container kanban-container">
        <EditKanbanCard 
            :item="selectedCard" 
            v-model:visible="isModalVisible"
            @close="closeModal" 
            @save="saveCard" 
            @remove="removeCard" 
            @clone="cloneCard" 
        />
        <h1 class="ui header">Kanban</h1>
        
        <div class="ui four column stackable grid">
            <div class="column vertical-lane" v-for="lane in kanbanStore.buckets.getBuckets()" :key="lane">
                <div class="ui segment" :style="{ backgroundColor: lane.color }" 
                     @drop="onDrop($event, lane.name)" 
                     @dragover.prevent 
                     @dragenter.prevent>
                    <h3 class="ui dividing header" style="display: flex; justify-content: space-between; align-items: center;">
                        {{ lane.label }}
                        <div class="ui custom-add-button">
                            <button class="ui mini primary circular icon button" data-tooltip="Adicionar" @click="addCard(lane.name)">
                                <i class="plus icon"></i>
                            </button>
                        </div>
                    </h3>
                    
                    <transition-group name="kanban-list" tag="div" class="ui cards">
                        <template v-for="cluster in lane.clusters.getClusters()" :key="cluster.key">
                            <h4 class="ui header kanban-group-header" v-if="cluster.key === 'EMPTY'">
                                No timesheets
                            </h4>
                            <h4 class="ui header kanban-group-header" v-else>
                                {{ cluster.key }} <div class="ui basic olive label">{{ dayOfWeek(cluster.key) }}</div>
                            </h4>
                            
                            <KanbanCard
                                 v-for="card in cluster.items" :key="card.id"
                                 :card="card"
                                 draggable="true"
                                 @dragstart="startDrag($event, card.id)"
                                 @drag="onDrag($event)"
                                 @dragend="endDrag($event)"
                                 @click="editCard(card)"
                                 :class="{ 'is-dragging': draggedCardId === card.id }"
                            />
                        </template>
                    </transition-group>
                </div>
            </div>
        </div>

        <div class="ui divider"></div>

        <!-- Search archived cards -->
        <div style="text-align: center;">
            <div class="ui search" style="display: inline-block;">
                <div class="ui icon input" style="width: 350px;">
                    <input class="prompt" type="text" placeholder="Pesquisar cards arquivados" v-model="searchQuery" @input="searchArchivedCards">
                    <i class="search icon"></i>
                </div>
            </div>
            
            <div v-if="searchResults.length > 0" style="margin-top: 2em; text-align: left;">
                <h4 class="ui horizontal divider header">
                    <i class="search icon"></i> Resultados da Busca
                </h4>
                <div class="ui four column stackable grid">
                    <div class="column" v-for="card in searchResults" :key="card.id">
                        <div class="ui cards" style="height: 100%;">
                            <KanbanCard
                                :card="card"
                                @click="editCard(card)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useKanbanStore } from '../stores/kanban-store.mjs'
import EditKanbanCard from '../components/EditKanbanCard.vue'
import KanbanCard from '../components/KanbanCard.vue'
import kanbanApi from '../services/kanban-api.mjs'
import { useKanbanDragAndDrop } from '../composables/useKanbanDragAndDrop.mjs'

const log = (message, object) => {
	if (object)
		console.log(`[Timesheet] ${message}`, object)
	else
		console.log(`[Timesheet] ${message}`)
}

log('Setting up...')

export default {
    name: 'Kanban',
    components: {
        EditKanbanCard,
        KanbanCard
    },
    setup() {
        const dragAndDrop = useKanbanDragAndDrop();
        return { dragAndDrop, draggedCardId: dragAndDrop.draggedCardId };
    },
    data() {
        return {
            kanbanStore: useKanbanStore(),
            isModalVisible: false,
            selectedCard: {},
            searchQuery: '',
            searchResults: []
        }
    },
    methods: {
        addCard(laneName) {
            this.selectedCard = {
                status: laneName,
                timesheets: []
            };
            this.isModalVisible = true;
        },
        editCard(card) {
            this.selectedCard = { ...card };
            this.isModalVisible = true;
        },
        saveCard(card) {
            // Find current bucket (might be undefined if new card)
            const currentBucket = this.kanbanStore.buckets.findItemById(card.id) 
                ? this.kanbanStore.buckets.getBucket(this.selectedCard.status)
                : null;
            this.kanbanStore.saveKanbanCard(currentBucket, card);
            this.isModalVisible = false;
            this.selectedCard = {};
        },
        removeCard(card) {
            const currentBucket = this.kanbanStore.buckets.getBucket(card.status);
            this.kanbanStore.deleteKanbanCard(currentBucket, card);
            this.isModalVisible = false;
            this.selectedCard = {};
        },
        cloneCard(card) {
            this.selectedCard = { ...card, id: null };
            this.selectedCard.timesheets = (card.timesheets || []).map(ts => ({ ...ts, id: null }));
        },
        closeModal(card) {
            log('Modal was closed');
            this.selectedCard = { ...card }; // persist state to not lose unsaved progress when accientally closed
        },
        async searchArchivedCards() {
            if (!this.searchQuery || this.searchQuery.length < 3) {
                this.searchResults = [];
                return;
            }
            try {
                const records = await kanbanApi.searchKanbanCards({
                    archived: true,
                    terms: this.searchQuery,
                    limit: 12
                });
                this.searchResults = records;
            } catch (error) {
                console.error('Error searching kanban cards:', error);
                this.searchResults = [];
            }
        },
        startDrag(evt, cardId) {
            evt.dataTransfer.setData('cardId', cardId);
            this.dragAndDrop.startVisualDrag(evt, cardId);
        },
        onDrag(evt) {
            this.dragAndDrop.onVisualDrag(evt);
        },
        endDrag(evt) {
            this.dragAndDrop.endVisualDrag(evt);
        },
        onDrop(evt, laneId) {
            const cardId = parseInt(evt.dataTransfer.getData('cardId'));
            if (cardId) {
                const toBucket = this.kanbanStore.buckets.getBucket(laneId);
                const draggedCard = this.kanbanStore.buckets.findItemById(cardId);

                if (draggedCard && toBucket) {
                    this.kanbanStore.moveCard(draggedCard, toBucket);
                }
            }
        },
        dayOfWeek(key) {
            if (!key) return '';
            const date = typeof key === 'string' ? new Date(`${key}T00:00:00`) : key;
            if (date instanceof Date && !isNaN(date.getTime())) {
                const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                const day = date.getDay();
                return days[day];
            }
            return key;
        }
    },
    mounted() {
        console.log('Kanban UI rendered from store state')
        this.kanbanStore.reloadKanbanCards();
    }
}
</script>

<style>
.ui.container.kanban-container {
    margin-top: 6em; /* Fixed menu offset */
    margin-bottom: 2em;
    width: 95% !important;
}

.ui.cards>.card.kanban-card {
    width: 100%;
    box-shadow: 0 1px 3px 0 #d4d4d5;
}

.ui.header.kanban-group-header {
    width: 100%;
    margin-top: 1em;
    margin-left: 0.6em;
}

.vertical-lane > .ui.segment {
    min-height: 150px;
}

/* Vue List Transitions */
.kanban-list-move, 
.kanban-list-enter-active, 
.kanban-list-leave-active {
    transition: all 0.3s ease;
}

.kanban-list-enter-from, 
.kanban-list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

</style>