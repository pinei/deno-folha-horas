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
            <div class="column" v-for="lane in kanbanStore.buckets.getBuckets()" :key="lane">
                <div class="ui segment" :style="{ backgroundColor: lane.color, minHeight: '150px' }" 
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
                            
                            <div class="card kanban-card"
                                 v-for="card in cluster.items" :key="card.id"
                                 draggable="true"
                                 @dragstart="startDrag($event, card.id)"
                                 @drag="onDrag($event)"
                                 @dragend="endDrag($event)"
                                 @click="editCard(card)"
                                 :class="{ 'is-dragging': draggedCardId !== null && draggedCardId === card.id }">
                                <div class="content">
                                    <h5>
                                        {{ card.issue }}
                                    </h5>
                                    <div class="meta">{{ cardContext(card) }}</div>
                                    <div class="description" style="margin-bottom: 1em;">
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
                                    <span v-for="cat in cardCategories(card)" :key="cat" class="ui label" :class="categoryClass(cat)">{{ cat }}</span>
                                    <span class="ui circular olive label inverted large right floated">{{ totalTimeSpent(card) }}</span>
                                </div>
                            </div>
                        </template>
                    </transition-group>
                </div>
            </div>
        </div>

        <div class="ui divider"></div>

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
                            <div class="card kanban-card" @click="editCard(card)">
                                <div class="content">
                                    <h5>
                                        {{ card.issue }}
                                    </h5>
                                    
                                    <div class="meta">{{ cardContext(card) }}</div>
                                    <div class="description" style="margin-bottom: 1em;">
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
                                    <span v-for="cat in cardCategories(card)" :key="cat" class="ui label" :class="categoryClass(cat)">{{ cat }}</span>
                                    <span class="ui circular olive label inverted large right floated">{{ totalTimeSpent(card) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useKanbanStore } from '../stores/kanban-store.mjs'
import { useCategoryStore } from '../stores/category-store.mjs'
import EditKanbanCard from '../components/EditKanbanCard.vue'
import kanbanApi from '../services/kanban-api.mjs'
import { useParseDescription } from '../composables/useParseDescription.mjs'

const { parseDescription } = useParseDescription();

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
        EditKanbanCard
    },
    data() {
        return {
            kanbanStore: useKanbanStore(),
            categoryStore: useCategoryStore(),
            draggedCardId: null,
            dragClone: null,
            dragOffset: { x: 0, y: 0 },
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
            evt.dataTransfer.dropEffect = 'move';
            evt.dataTransfer.effectAllowed = 'move';
            evt.dataTransfer.setData('cardId', cardId);
            
            // Hide the default semi-transparent HTML5 drag image
            const emptyImage = new Image();
            emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            evt.dataTransfer.setDragImage(emptyImage, 0, 0);

            // Record mouse offset relative to the card's top-left corner
            const rect = evt.target.getBoundingClientRect();
            this.dragOffset.x = evt.clientX - rect.left;
            this.dragOffset.y = evt.clientY - rect.top;

            // Create a wrapper for the solid clone to act as the custom drag image
            const wrapper = document.createElement('div');
            wrapper.className = 'ui cards';
            wrapper.style.position = 'fixed';
            wrapper.style.top = rect.top + 'px';
            wrapper.style.left = rect.left + 'px';
            wrapper.style.width = rect.width + 'px';
            wrapper.style.height = rect.height + 'px';
            wrapper.style.pointerEvents = 'none'; // So it doesn't block drop targets
            wrapper.style.zIndex = '9999';
            wrapper.style.transform = 'rotate(3deg)'; // Add slight rotation for drag feel

            const cardClone = evt.target.cloneNode(true);
            cardClone.style.margin = '0';
            cardClone.style.backgroundColor = '#fff';
                        
            // Remove the 'is-dragging' class if it was cloned with it
            cardClone.classList.remove('is-dragging');
            
            wrapper.appendChild(cardClone);
            this.dragClone = wrapper;
            document.body.appendChild(this.dragClone);
            
            // Wait for native drag image to capture the card before turning original into placeholder
            setTimeout(() => {
                this.draggedCardId = cardId;
            }, 0);
        },
        onDrag(evt) {
            if (this.dragClone && (evt.clientX !== 0 || evt.clientY !== 0)) {
                this.dragClone.style.left = (evt.clientX - this.dragOffset.x) + 'px';
                this.dragClone.style.top = (evt.clientY - this.dragOffset.y) + 'px';

                this.autoScroll(evt);
            }
        },
        autoScroll(evt) {
            // Auto-scroll window when dragging near the edges
            const scrollMargin = 60;
            const scrollSpeed = 20;

            let scrollX = 0;
            let scrollY = 0;

            if (evt.clientY < scrollMargin) {
                scrollY = -scrollSpeed;
            } else if (window.innerHeight - evt.clientY < scrollMargin) {
                scrollY = scrollSpeed;
            }

            if (evt.clientX < scrollMargin) {
                scrollX = -scrollSpeed;
            } else if (window.innerWidth - evt.clientX < scrollMargin) {
                scrollX = scrollSpeed;
            }

            if (scrollX !== 0 || scrollY !== 0) {
                window.scrollBy(scrollX, scrollY);
            }
        },
        endDrag(evt) {
            this.draggedCardId = null;
            if (this.dragClone) {
                document.body.removeChild(this.dragClone);
                this.dragClone = null;
            }
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
        },
        totalTimeSpent(card) {
            return (card.timesheets || []).reduce((sum, ts) => sum + (parseFloat(ts.timeSpent) || 0), 0)
        },
        cardCategories(card) {
            const ts = card.timesheets || []
            if (ts.length === 0) return ['EMPTY']
            const categories = [...new Set(ts.map(t => t.category).filter(c => c))]
            return categories.length > 0 ? categories : ['EMPTY']
        },
        cardContext(card) {
            const ts = card.timesheets || []
            if (ts.length === 0) return ''
            const contexts = [...new Set(ts.map(t => t.context).filter(c => c))]
            return contexts.join(', ')
        },
        categoryClass(value) {
            return this.categoryStore.getCategoryColor(value)
        },
        parseLines(text) {
            if (!text || text.trim() === '') return []
            return text.split('\n').filter(line => line.trim() !== '')
        },
        parseDescription(description) {
            return parseDescription(description)
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
    margin-top: 2em;
    margin-bottom: 2em;
    width: 95% !important;
}

.ui.cards>.card.kanban-card {
    width: 100%;
    box-shadow: 0 1px 3px 0 #d4d4d5;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}

.ui.cards>.card.kanban-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px 0 rgba(34, 36, 38, .12), 0 2px 4px 0 rgba(34, 36, 38, .08);
}

.ui.cards>.card.kanban-card.is-dragging {
    background-color: rgba(0, 0, 0, 0.05) !important;
    border: 2px dashed #a0a0a0 !important;
    box-shadow: none !important;
    color: transparent !important;
}

.ui.cards>.card.kanban-card.is-dragging > * {
    visibility: hidden;
}

.ui.header.kanban-group-header {
    width: 100%;
    margin-top: 1em;
    margin-left: 0.6em;
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

.kanban-card p.ui.blue {
    color: rgb(0, 0, 128);
}

.kanban-card p.ui.green {
    color: rgb(0, 64, 0);
}

.kanban-card span.ui.tag.label {
    padding-left: 1em;
    padding-right: 1em;
}

.ui.card>.content p, .ui.cards>.card>.content p {
    margin: 0 0 1em;
}

</style>