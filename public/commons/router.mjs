import {createWebHistory, createRouter} from "vue-router";
import { ref, load } from './vue-loader.mjs'

console.log('Setting up router...')

// import Timesheet from '../pages/Timesheet.vue';
// import SAPCodes from '../pages/SAPCodes.vue';

const Timesheet = ref('../pages/Timesheet.vue')
const SAPCodes = ref('../pages/SAPCodes.vue')
const MonthTimeReport = ref('../pages/TimesheetMonthTimeReport.vue')
const FactsAndDeliveriesReport = ref('../pages/FactsAndDeliveriesReport.vue')

// const Export = ref('../pages/Export.vue')
// const Import = ref('../pages/Import.vue')

const ModalLab = ref('../pages/ModalLab.vue')

export const routes = [
    {
        name: 'timesheet',
        path: '/',
        component: Timesheet
    },
    {
        name: 'sap-codes',
        path: '/sap-codes',
        component: SAPCodes
    },
    {
        name: 'import',
        path: '/import',
        // component: Import
    },
    {
        name: 'export',
        path: '/export',
        // component: Export
    },
    {
        name: 'month-time-report',
        path: '/month-time-report',
        component: MonthTimeReport
    },
    {
        name: 'facts-and-deliveries-report',
        path: '/facts-and-deliveries-report',
        component: FactsAndDeliveriesReport
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes,
});

export default router;