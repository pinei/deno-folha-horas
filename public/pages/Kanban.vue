<template>
    <div class="ui container kanban-container">
        <h1 class="ui header">Kanban</h1>
        
        <div class="ui four column stackable grid">
            <div class="column" v-for="lane in kanbanStore.lanes" :key="lane.id">
                <div class="ui segment" :style="{ backgroundColor: lane.color }" 
                     @drop="onDrop($event, lane.id)" 
                     @dragover.prevent 
                     @dragenter.prevent>
                    <h3 class="ui dividing header" style="display: flex; justify-content: space-between; align-items: center;">
                        {{ lane.title }}
                        <div class="ui custom-add-button">
                            <button class="ui mini primary circular icon button" data-tooltip="Adicionar">
                                <i class="plus icon"></i>
                            </button>
                        </div>
                    </h3>
                    
                    <transition-group name="kanban-list" tag="div" class="ui cards">
                        <template v-for="(group, gIndex) in lane.dateGroups" :key="group.date">
                            <h4 class="ui header kanban-group-header">
                                {{ group.date }} <div class="ui basic olive label">{{ group.label }}</div>
                            </h4>
                            
                            <div class="card kanban-card"
                                 v-for="card in group.cards" :key="card.id"
                                 draggable="true"
                                 @dragstart="startDrag($event, card.id)"
                                 @drag="onDrag($event)"
                                 @dragend="endDrag($event)"
                                 :class="{ 'is-dragging': draggedCardId === card.id }">
                                <div class="content">
                                    <h5>
                                        {{ card.title }}
                                    </h5>
                                    <div class="meta">{{ card.meta }}</div>
                                    <div class="description" style="margin-bottom: 1em;">
                                        {{ card.description }}
                                    </div>
                                    <template v-for="(cat, cIndex) in card.categories" :key="cIndex">
                                        <span :class="['ui label', cat.color]">{{ cat.label }}</span>
                                    </template>
                                    <span class="ui circular olive label inverted large right floated">{{ card.hours }}</span>
                                </div>
                            </div>
                        </template>
                    </transition-group>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useKanbanStore } from '../stores/kanban-store.mjs'

export default {
    name: 'Kanban',
    data() {
        return {
            kanbanStore: useKanbanStore(),
            draggedCardId: null,
            dragClone: null,
            dragOffset: { x: 0, y: 0 }
        }
    },
    methods: {
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
                this.kanbanStore.moveCard(cardId, laneId);
            }
        }
    },
    mounted() {
        console.log('Kanban UI rendered from store state')
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

</style>