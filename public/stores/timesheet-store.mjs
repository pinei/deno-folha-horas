import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import timesheetService from '../services/timesheet-api.mjs'

import { GroupsOfRecords } from '../domain/clusters.ts'

export const useTimesheetStore = defineStore('timesheet', () => {
    console.log('Setting up Timesheet Store...')

    const currentDate = ref(new Date())

    // Records grouped by date
    const groupsOfRecords = reactive(new GroupsOfRecords())

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

    function totalTimeSpent(group) {
        const total = group.records.reduce((total, record) => {
            let timeSpent = parseFloat(record.timeSpent)
            if (isNaN(timeSpent)) timeSpent = 0
            return total + timeSpent
        }, 0)
        return total
    }

    function setRecords(records) {
        groupsOfRecords.setRecords(records)
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
        const originalRecord = groupsOfRecords.findRecordById(editedRecord.id)

        if (originalRecord) {
            groupsOfRecords.removeRecord(originalRecord)

            Object.assign(originalRecord, editedRecord)

            const saved = await timesheetService.saveRecord(editedRecord)
            groupsOfRecords.addRecord(saved)
        }
        else {
            throw new Error('Registro não selecionado')
        }
    }

    async function addRecord(record) {
        const saved = await timesheetService.saveRecord(record)
        groupsOfRecords.addRecord(saved)
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

            _updateSummary(groupsOfRecords.getRecords())
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
                groupsOfRecords.removeRecord(record)
                _updateSummary(groupsOfRecords.getRecords())
            }

        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    return {
        totalTimeSpent,
        groupsOfRecords: groupsOfRecords.getGroups(),
        removeRecord,
        mergeRecord,
        loadRecordsForTerms,
        loadRecordsForMonth,
        summary
    }
})