<template>
    <div id="timesheet-month-time-report">
        <h1 class="ui header">Relatório para Apontamento de Horas</h1>

        <form class="ui form">
            <div class="fields">
                <div class="field">
                    <label>Mës</label>
                    <Calendar v-model="state.calendarDate"/>
                </div>
            </div>
            <div class="ui primary button" @click="generate()" data-tooltip="Gerar">Generate</div>
        </form>
        
        <div v-if="state.report.length > 0" >
            <div class="ui scrolling container">
                <table class="ui first head foot stuck unstackable celled table">
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th>Tipo Ativ.</th>
                            <th>Elem. PEP</th>
                            <th>Diag. Rede</th>
                            <th>Op.</th>
                            <th>Subop.</th>
                            <th>Part.</th>
                            <th>Centro Trabalho</th>
                            <th>Centro</th>
                            <th>Total</th>
                            <th v-for="day of getDays()">
                                {{ day }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="record in state.report">
                            <td><b>{{ record.CATEGORY }}</b></td>
                            <td>{{ record.TIPO_ATIVIDADE }}</td>
                            <td>{{ record.ELEMENTO_PEP }}</td>
                            <td>{{ record.DIAGRAMA_REDE }}</td>
                            <td>{{ record.OPERACAO }}</td>
                            <td>{{ record.SUBOPERACAO }}</td>
                            <td>{{ record.PARTICAO }}</td>
                            <td>{{ record.CENTRO_TRABALHO }}</td>
                            <td>{{ record.CENTRO }}</td>
                            <td>{{ record.TOTAL }}</td>
                            <td v-for="day of getDays()">
                                {{ record[day] }}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>TOTAL</th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th>{{ state.summary['TOTAL'] }}</th>
                            <td v-for="day of getDays()">
                                {{ state.summary[day] || '' }}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <form class="ui form">
                <div class="ui primary right floated button" @click="copyTSV()" data-tooltip="Copiar para o SAP">Copy TSV</div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import timesheetReportApi from '../services/timesheet-report-api.mjs';

const log = (message, object) => {
    if (object)
        console.log(`[TimesheetMonthTimeReport] ${message}`, object)
    else
        console.log(`[TimesheetMonthTimeReport] ${message}`)
}

const state = reactive({
    calendarDate: new Date(),
    report: [],
    days: [],
    summary: {}
});

const getDays = () => {
    const days = [];
    const date = new Date(state.calendarDate);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
        days.push(i.toString().padStart(2, '0'));
    }
    return days;
}

const getSummary = () => {
    const summary = {}

    const columns = ['TOTAL', ...getDays()]

    for (const column of columns) {
        summary[column] = state.report.reduce((acc, record) => {
                const value = parseFloat(( record[column] || '0' ).replace(',', '.'))
                acc += value
                return acc
            }, 0)
    }

    return summary
}

const generate = async () => {
    log('Generating report...')
    state.report = await timesheetReportApi.getMonthTimesheet(state.calendarDate)
    state.summary = getSummary()
    state.days = getDays()
}

const copyTSV = async () => {
    const fields = [ 'TIPO_ATIVIDADE', 'ELEMENTO_PEP', 'DIAGRAMA_REDE', 'OPERACAO', 'SUBOPERACAO', 'PARTICAO', 
        'CENTRO_TRABALHO', 'CENTRO', 'TOTAL', ...getDays() ]

    const output = state.report.map(record => 
        fields.map(field => record[field]).join('\t')
    ).join('\n');

    try {
        await navigator.clipboard.writeText(output);
        log('Copied to clipboard');
    } catch (err) {
        log('Failed to copy: ', err);
    }
}

onMounted(() => {
    log('Mounted...')
});

</script>

<style>
#timesheet-month-time-report .ui.scrolling.container {
    max-height: 100%;
    margin-bottom: 1.5em;
}

#timesheet-month-time-report .ui.table>tfoot>tr>td,.ui.table>tfoot>tr>th {
    font-style: none;
    font-weight: 700;
}
</style>