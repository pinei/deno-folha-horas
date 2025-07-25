<template>
    <div v-if="state.summary.total > 0" class="ui segment">
        <div v-for="category of state.summary.categories" :key="category.name"
            :data-name="category.name"
            :data-value="category != null ? category.timeSpent : 0"
            :data-total="state.summary.total"
            class="ui olive progress">
            <div class="label">{{ category.name }}</div>
            <div class="bar">
                <div class="progress"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch, nextTick, reactive } from 'vue'

const log = (message, object) => {
	if (object)
		console.log(`[TimesheetSummary] ${message}`, object)
	else
		console.log(`[TimesheetSummary] ${message}`)
}

/* Properties */

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  }
});

/* State */

const state = reactive({
    summary: {
        categories: [],
        total: 0
    }
});

/* Watches */

watch(() => props.summary, (newValue) => {
    log(`Summary changed: ${JSON.stringify(newValue)}`)

    state.summary = {...newValue}

    nextTick(() => {
        for (const category of state.summary.categories) {
            $(`.ui.progress[data-name="${category.name}"]`).progress({
                text: {
                    percent : '{value} ({percent}%)',
                },
                total: state.summary.total,
                value: category.timeSpent,
            });
        }
    })
})

/* Lifecycle */

onMounted(() => {
    log('Mounted...')
});

</script>
