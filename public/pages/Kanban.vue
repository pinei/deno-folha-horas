<template>
    <div class="ui container kanban-container">
        <h1 class="ui header">Kanban</h1>
        
        <div class="ui four column stackable grid">
            <div class="column" v-for="lane in kanbanStore.lanes" :key="lane.id">
                <div class="ui segment" :style="{ backgroundColor: lane.color }">
                    <h3 class="ui dividing header">{{ lane.title }}</h3>
                    
                    <div class="ui cards">
                        <template v-for="(group, gIndex) in lane.dateGroups" :key="gIndex">
                            <h4 class="ui header kanban-group-header">
                                {{ group.date }} <div class="ui basic olive label">{{ group.label }}</div>
                            </h4>
                            
                            <div class="card kanban-card" v-for="card in group.cards" :key="card.id">
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
                    </div>
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
            kanbanStore: useKanbanStore()
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

.ui.header.kanban-group-header {
    width: 100%;
    margin-top: 1em;
    margin-left: 0.6em;
}
</style>