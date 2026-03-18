import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import timesheetService from '../services/timesheet-api.mjs'

import { Clusters } from '../domain/clusters.ts'

export const useTimesheetStore = defineStore('timesheet', () => {
    console.log('Setting up Timesheet Store...')

    const currentDate = ref(new Date())

    const clusters = reactive(new Clusters((item) => item.date, 'DESC'))

    const summary = ref({
        categories: [],
        total: 0
    })

    const loading = ref(false)
    const error = ref(null)

    function _updateSummary(records) {
        const categoriesMap = {}
        let total = 0;

        for (const record of records) {
            const category = record.category
            if (!categoriesMap[category]) {
                categoriesMap[category] = { timeSpent: 0 }
            }
            categoriesMap[category].timeSpent += record.timeSpent
            total += Number(record.timeSpent)
        }

        const categoriesList = []

        // Translate from object to array
        for (const name in categoriesMap) {
            const timeSpent = categoriesMap[name].timeSpent;

            categoriesList.push({
                name: name,
                timeSpent: timeSpent,
            });
        }

        // Sort by name
        categoriesList.sort((a, b) => a.name.localeCompare(b.name));

        summary.value = {
            categories: categoriesList,
            total: total,
        }
    }

    function totalTimeSpent(items) {
        if (!items) return 0.0

        const total = items.reduce((total, record) => {
            let timeSpent = parseFloat(record.timeSpent)
            if (isNaN(timeSpent)) timeSpent = 0
            return total + timeSpent
        }, 0)
        return total
    }

    function setRecords(records) {
        clusters.setItems(records)
        _updateSummary(records)
    }

    async function loadRecordsForMonth(date) {
        try {
            currentDate.value = date || new Date()
            loading.value = true

            const year = currentDate.value.getFullYear()
            const month = currentDate.value.getMonth()
            const records = await timesheetService.getTimesheetByMonth(year, month)

            setRecords(records)
        } finally {
            loading.value = false
        }
    }

    async function loadRecordsForTerms(category, terms) {
        try {
            loading.value = true
            const records = await timesheetService.getTimesheetByTerms(category, terms)

            setRecords(records)
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    async function updateRecord(editedRecord) {
        const originalRecord = clusters.findItemById(editedRecord.id)

        if (originalRecord) {
            clusters.removeItem(originalRecord)

            Object.assign(originalRecord, editedRecord)

            const saved = await timesheetService.saveRecord(editedRecord)
            clusters.addItem(saved)
        }
        else {
            throw new Error('Registro não selecionado')
        }
    }

    async function addRecord(record) {
        const saved = await timesheetService.saveRecord(record)
        clusters.addItem(saved)
    }

    async function mergeRecord(record) {
        try {
            loading.value = true

            if (record.id) {
                await updateRecord(record)
            }
            else {
                await addRecord(record)
            }

            _updateSummary(clusters.getItems())
        }
        finally {
            loading.value = false
        }
    }

    async function removeRecord(record) {
        try {
            loading.value = true
            const deleted = await timesheetService.deleteRecord(record)
            if (deleted) {
                clusters.removeItem(record)
                _updateSummary(clusters.getItems())
            }

        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    async function linkKanbanCard(record, kanbanCardId) {
        try {
            loading.value = true
            const updated = await timesheetService.linkKanbanCard(record.id, kanbanCardId)

            // Update the record in-place within clusters
            const originalRecord = clusters.findItemById(record.id)
            if (originalRecord) {
                Object.assign(originalRecord, updated)
            }
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    return {
        totalTimeSpent,
        clusters: clusters.getClusters(),
        removeRecord,
        mergeRecord,
        loadRecordsForTerms,
        loadRecordsForMonth,
        linkKanbanCard,
        summary
    }
})