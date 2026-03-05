<template>
    <div id="facts-and-deliveries-report">
        <h1 class="ui header">Relatório de Fatos Relevantes e Entregas</h1>

        <form class="ui form">
            <div class="fields">
                <div class="field">
                    <label>Mës início</label>
                    <Calendar v-model="state.calendarDateStart"/>
                </div>
                <div class="field">
                    <label>Mës final</label>
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

        <div class="ui form" style="margin-top: 2em;" v-show="Object.keys(filteredAndGroupedByWeek).length > 0">
            <div class="field">
                <label>Markdown Gerado</label>
                <textarea rows="20" readonly style="font-family: monospace; line-height: 1.5;">{{ generateMarkdown() }}</textarea>
            </div>
            <div class="ui primary button" @click="copyMarkdown()" data-tooltip="Copiar Markdown para a área de transferência">Copiar Tudo</div>
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
    const data = await timesheetReportApi.getFactsAndDeliveries(state.calendarDateStart, state.calendarDateEnd)

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

const generateMarkdown = () => {
    return Object.entries(filteredAndGroupedByWeek.value).map(([week, categories]) => {
        const weekHeader = `## Semana ${week}`;
        
        const categoriesText = Object.entries(categories).map(([category, records]) => {
            const categoryHeader = `\n\n### ${category}\n`;

            const allFacts = [];
            const allDeliveries = [];

            records.forEach(record => {
                parseRelevantFacts(record.RELEVANT_FACTS).forEach(line => {
                    allFacts.push(`- ${record.CONTEXT} ➜ ${line}`);
                });

                parseDeliveries(record.DELIVERIES).forEach(line => {
                    allDeliveries.push(`- ${record.CONTEXT} ➜ ${line}`);
                });
            });

            let combinedText = '';

            if (allFacts.length > 0) {
                combinedText += `\n**Fatos Relevantes**\n${allFacts.join('\n')}\n`;
            }

            if (allDeliveries.length > 0) {
                combinedText += `\n**Entregas**\n${allDeliveries.join('\n')}\n`;
            }

            return categoryHeader + combinedText;
        }).join('');
        
        return weekHeader + categoriesText;
    }).join('\n\n');
};

const copyMarkdown = async () => {
    const text = generateMarkdown();
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