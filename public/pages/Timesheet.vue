<template>
    <TimesheetSearchBar v-model="state.searchBar" @search="search"/>

    <TimesheetSummary :summary="timesheetStore.summary"/>

    <EditRecord
        :item="state.selectedRecord" :visible="state.isModalVisible"
        @close="closeModal" @save="saveRecord" @remove="removeRecord" @clone="cloneRecord"/>

    <div id="timesheet-panel">
        <div v-if="!(timesheetStore.groupsOfRecords.length > 0)">
            <h3 class="ui header">Nenhum registro encontrado</h3>
            <button class="ui small primary icon button" @click="addRecord(null)" data-tooltip="Novo registro">
                <i class="plus icon"></i>
            </button>
        </div>

        <!-- <div v-for="group in timesheetStore.groupsOfRecords" :key="group.date" style="position: relative"> -->
        <div v-for="group in timesheetStore.groupsOfRecords" :key="group.date" class="ui form">

            <h4 class="ui header">{{ group.date }}
                <div class="ui basic olive label">
                    {{ dayOfWeek(group.date) }}
                </div>
            </h4>

            <table class="ui selectable compact table">
            <thead>
            <tr>
                <th class="one wide" data-tooltip="Tempo (esforço)"><i class="clock outline icon"></i></th>
                <th class="one wide" data-tooltip="Categoria"><i class="tag icon"></i></th>
                <th class="fourteen wide" data-tooltip="Descritivo"><i class="align left icon"></i></th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="!(group.records?.length > 0)">
                <td colspan="4">Sem registros</td>
            </tr>

            <tr v-for="record in group.records" :key="record.id">
                <td @click="editRecord(record)"><span class="ui circular olive label inverted large">{{ record.timeSpent }}</span></td>
                <td @click="editRecord(record)"><span class="ui label" :class="categoryClass(record.category)">{{ record.category }}</span></td>
                <td @click="editRecord(record)">
                    <h5 v-if="record.context">{{ record.context }}</h5>
                    <p v-for="line in parseDescription(record.description)">
                        <span v-html="line"></span>
                    </p>
                    <p v-for="line in parseRelevantFacts(record.relevantFacts)" data-tooltip="Fato Relevante" data-position="top left" class="ui blue">
                        <i class="circle exclamation icon"></i>{{ line }}
                    </p>
                    <p v-for="line in parseDeliveries(record.deliveries)" data-tooltip="Entrega" data-position="top left" class="ui green">
                        <i class="cube icon"></i>{{ line }}
                    </p>
                </td>
            </tr>
            </tbody>

            <tfoot class="full-width">
            <tr>
                <th><span class="ui circular label inverted large" :class="timeSpentClass(timesheetStore.totalTimeSpent(group))">= <b>{{ timesheetStore.totalTimeSpent(group) }}</b></span></th>
                <th colspan="2">
                    <!-- Reservado -->
                </th>
            </tr>
            </tfoot>

            </table>
            <div class="ui custom-add-button">
                <button class="ui mini primary circular icon button" @click="addRecord(group)" data-tooltip="Adicionar">
                    <i class="plus icon"></i> 
                </button>
            </div>

        </div>
    </div>
</template>

<!-- @ TODO
	Refactoring do uso de componentes de edição (clone de objeto) com sugestão do Gemini
	https://g.co/gemini/share/2aded8b07748

    Nomenclatura para eventos de componentes
    https://www.perplexity.ai/search/no-vu3-tem-padrao-de-nomenclat-Y8eYUd3eSHGhr20R0jL4WQ

-->
<script setup>
import { reactive, watch, onMounted, computed } from 'vue';
import { useTimesheetStore } from '../stores/timesheet-store.mjs';
import { useCategoryStore } from '../stores/category-store.mjs';

const log = (message, object) => {
	if (object)
		console.log(`[Timesheet] ${message}`, object)
	else
		console.log(`[Timesheet] ${message}`)
}

log('Setting up...')

const timesheetStore = useTimesheetStore();
const categoryStore = useCategoryStore();

/* State */

const state = reactive({
    searchBar: {
        searchText: '',
        calendarDate: new Date(),
    },
    isModalVisible: false,
    selectedRecord: {}
});

/* Methods */

const search = () => {
    console.log(`Search: ${state.searchBar.searchText}`)

    let searchText = state.searchBar.searchText.trim()

    if (searchText != '')
    {
        const regex = /(?:category:(\w+))?\s*(.*)/;
        const match = regex.exec(searchText);

        if (match) {
            let category = match[1] || null;
            let terms = match[2] || null;

            timesheetStore.loadRecordsForTerms(category, terms)
        }
    }

}

const tagColor = (text) => {
    const colors = [
        'red',
        'orange',
        'yellow',
        'olive',
        'green',
        'teal',
        'blue',
        'violet',
        'purple',
        'pink',
        'brown',
        'grey',
        'black'
    ];

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;

    return colors[index];
}

const categoryClass = (value) => {
    return categoryStore.getCategoryColor(value)
}

const timeSpentClass = (value) => {
    if (value < 8)
        return { 'orange': true }
    if (value > 8)
        return { 'blue': true }

    return  { 'olive': true }
}

const parseDescription = (description) => {
    // Tags
    const regex = /#[\w]+/g
    const richText = description.replace(regex, (match) => {
        const tag = match.substring(1)
        // Cor arbitrária baseada no texto da tag
        const color = tagColor(tag)
        return `<span class="ui ${color} tag label">${tag}</span>`
    })

    // Múltiplas linhas
    const lines = richText.split('\n')

    return lines
}

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

const dayOfWeek = (date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const day = new Date(date).getUTCDay();
    return days[day];
}

/* Events */

const editRecord = (record) => {
    state.selectedRecord = {...record};
    log(`Edititng record:`, state.selectedRecord)
    state.isModalVisible = true
}

const addRecord = (group) => {
    if (state.selectedRecord.id != null) {
        state.selectedRecord = {};
    }

    const date = group?.date || (new Date()).toISOString().substring(0, 10);
    state.selectedRecord.date = date;

    log(`New record:`, state.selectedRecord)
    state.isModalVisible = true;
}

const removeRecord = (record) => {
    log(`Removing record: ${JSON.stringify(record)}`)
    timesheetStore.removeRecord(record);
    state.isModalVisible = false;
    state.selectedRecord = {};
}

const saveRecord = (record) => {
    log(`Saving record: ${JSON.stringify(record)}`)
    timesheetStore.mergeRecord(record);
    state.isModalVisible = false;
    state.selectedRecord = {};
}

const cloneRecord = (record) => {
    log(`Cloning record:`, record)
    state.selectedRecord = {...record};
    state.selectedRecord.id = null;
}

const closeModal = (record) => {
	log(`Modal closed`)
    state.selectedRecord = {...record}; // permite recuperar o estado após fechar a janela de edição
	state.isModalVisible = false
}

/* Watches */

watch(() => state.searchBar.calendarDate, (newValue, oldValue) => {
    log(`Calendar date changed: ${newValue}`)

    timesheetStore.loadRecordsForMonth(newValue);
})

/* Lifecycle */

onMounted(() => {
    log(`Mounted...`)
    timesheetStore.loadRecordsForMonth(state.searchBar.calendarDate);
})
</script>

<style>
span.ui.tag.label {
    padding-left: 1em;
    padding-right: 1em;
}

#timesheet-panel p.ui.blue {
    color: rgb(0, 0, 128);
}

#timesheet-panel p.ui.green {
    color: rgb(0, 64, 0);
}

#timesheet-panel div.ui.custom-add-button {
    position: absolute;
    bottom: 0.5em;
    right: -3em;
}
</style>