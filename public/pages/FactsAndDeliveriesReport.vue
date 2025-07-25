<template>
    <div id="facts-and-deliveries-report">
        <h1 class="ui header">Relatório de Fatos Relevantes e Entregas</h1>

        <form class="ui form">
            <div class="fields">
                <div class="field">
                    <label>Mës início (@todo)</label>
                    <Calendar v-model="state.calendarDateStart"/>
                </div>
                <div class="field">
                    <label>Mës final (@todo)</label>
                    <Calendar v-model="state.calendarDateEnd"/>
                </div>
            </div>
            <div class="ui primary button" @click="generate()" data-tooltip="Gerar">Generate</div>
        </form>

        <!--
            Arrow symbols reference
            https://altcodeunicode.com/alt-codes-arrow-keyboard-arrow-dingbat-arrow-symbols/
         -->
        <div v-show="state.availableCategories.length > 0">
            <div class="ui segment">
                <h4 class="ui dividing header">Configurações</h4>
                <form class="ui form">
                    <div class="field">
                        <label>Categorias:</label>
                        <select class="ui search dropdown" multiple="" v-model="state.selectedCategories">
                            <option v-for="category in state.availableCategories" :key="category" :value="category">{{ category }}</option>
                        </select>
                    </div>
                </form>
            </div>
        </div>
        <div v-for="(categories, week) in filteredAndGroupedByWeek" class="ui vertical segment container">
            <h2 class="ui header">Semana {{ week }}</h2>
            <div v-for="(records, category) in categories">
                <h3 class="ui header">{{ category }}</h3>
                <ul class="ui no-bullets">
                    <template v-for="record in records">
                        <li v-for="line in parseRelevantFacts(record.RELEVANT_FACTS)" >
                            <i class="circle exclamation icon"></i>{{ record.CONTEXT }} ➜ {{ line }}
                        </li>
                        <li v-for="line in parseDeliveries(record.DELIVERIES)">
                            <i class="cube icon"></i>{{ record.CONTEXT }} ➜ {{ line }}
                        </li>
                    </template>
                </ul>
            </div>
            <div class="ui custom-copy-button">
                <button class="ui mini primary circular icon button" @click="copyMarkdown(week, categories)" data-tooltip="Copy Markdown">
                    <i class="copy icon"></i> 
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, onMounted, watch, computed } from 'vue';
import timesheetReportApi from '../services/timesheet-report-api.mjs';

const log = (message, object) => {
    if (object)
        console.log(`[FactsAndDeliveriesReport] ${message}`, object)
    else
        console.log(`[FactsAndDeliveriesReport] ${message}`)
}

/* State */

const state = reactive({
    calendarDateStart: new Date(),
    calendarDateEnd: new Date(),
    groupedByWeek: {},
    availableCategories: [],
    selectedCategories: []
});

/* Watches */

watch(() => state.selectedCategories, (newValue) => {
    log('Selected categories changed', newValue)
})

/* Computed */

const filteredAndGroupedByWeek = computed(() => {
    const filteredGroupedByWeek = Object.keys(state.groupedByWeek).reduce((acc, week) => {
        const categories = state.groupedByWeek[week];

        const filteredCategories = Object.keys(categories).reduce((acc, category) => {
            if (state.selectedCategories.length == 0 || state.selectedCategories.includes(category)) {
                acc[category] = categories[category];
            }
            return acc;
        }, {});

        if (Object.keys(filteredCategories).length > 0) {
            acc[week] = filteredCategories;
        }

        return acc;
    }, {});

    return filteredGroupedByWeek;
})

/* Methods */

const parseRelevantFacts = (relevantFacts) => {
    if (relevantFacts == null || relevantFacts == '')
        return []
    return relevantFacts.split('\n')
}

const parseDeliveries = (deliveries) => {
    if (deliveries == null || deliveries == '')
        return []
    return deliveries.split('\n')
}

const generate = async () => {
    const data = await timesheetReportApi.getFactsAndDeliveries()

    const groupedByWeek = data.reduce((acc, record) => {
        const week = record['WEEK'];
        const category = record['CATEGORY'];

        if (!acc[week]) {
            acc[week] = {};
        }
     
        if (!acc[week][category]) {
           acc[week][category] = [];
        }

        acc[week][category].push(record);
        return acc;
    }, {});

    state.groupedByWeek = groupedByWeek;

    state.availableCategories = data.reduce((acc, record) => {
        const category = record['CATEGORY'];
        if (!acc.includes(category)) {
            acc.push(category);
        }
        return acc;
    }, []);

    log('Available categories:', state.availableCategories)
}

const copyMarkdown = async (week, categories) => {
    const text = `## Semana ${week}` + 
        Object.entries(categories).map(([category, records]) => {
            const categoryHeader = `\n\n### ${category}\n`;

            const recordsText = records.map(record => {
                const relevantFactsText = parseRelevantFacts(record.RELEVANT_FACTS)
                    .map(line => `\n- ${record.CONTEXT} ➜ ${line}`)
                    .join('');

                const deliveriesText = parseDeliveries(record.DELIVERIES)
                    .map(line => `\n- ${record.CONTEXT} ➜ ${line}`)
                    .join('');

                return relevantFactsText + deliveriesText;
            }).join('');

            return categoryHeader + recordsText;
        }).join('');

    try {
        await navigator.clipboard.writeText(text);
        log('Copied to clipboard');
    } catch (err) {
        log('Failed to copy: ', err);
    }
};

/* Lifecycle */

onMounted(() => {
    log('Mounted...')
    $('#facts-and-deliveries-report .ui.search.dropdown').dropdown();
})
</script>


<style>
#facts-and-deliveries-report ul.no-bullets {
  list-style-type: none;
  margin-bottom: 1em;
}

#facts-and-deliveries-report ul.no-bullets > li {
  padding-bottom: 0.8em;
}

#facts-and-deliveries-report div.ui.custom-copy-button {
    position: absolute;
    bottom: 2.5em;
    right: -3em;
}

</style>