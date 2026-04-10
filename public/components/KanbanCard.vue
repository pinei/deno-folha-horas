<template>
    <div class="card kanban-card">
        <div class="content">
            <h5>
                {{ card.issue }}
            </h5>
            
            <div v-if="!simple" class="meta">{{ cardContext(card) }}</div>
            <div class="description" :style="simple ? 'margin-bottom: 1em; margin-top: 0.5em;' : 'margin-bottom: 1em;'">
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
            <span v-if="!simple" class="ui circular olive label inverted large right floated">{{ totalTimeSpent(card) }}</span>
        </div>
    </div>
</template>

<script setup>
import { useParseDescription } from '../composables/useParseDescription.mjs';
import { useCategoryStore } from '../stores/category-store.mjs';

const { parseDescription } = useParseDescription();
const categoryStore = useCategoryStore();

defineProps({
    card: {
        type: Object,
        required: true
    },
    simple: {
        type: Boolean,
        default: false
    }
});

function parseLines(text) {
    if (!text || text.trim() === '') return []
    return text.split('\n').filter(line => line.trim() !== '')
}

function cardCategories(card) {
    const ts = card.timesheets || []
    if (ts.length === 0) return ['EMPTY']
    const categories = [...new Set(ts.map(t => t.category).filter(c => c))]
    return categories.length > 0 ? categories : ['EMPTY']
}

function categoryClass(value) {
    return categoryStore.getCategoryColor(value)
}

function cardContext(card) {
    const ts = card.timesheets || []
    if (ts.length === 0) return ''
    const contexts = [...new Set(ts.map(t => t.context).filter(c => c))]
    return contexts.join(', ')
}

function totalTimeSpent(card) {
    return (card.timesheets || []).reduce((sum, ts) => sum + (parseFloat(ts.timeSpent) || 0), 0)
}
</script>
