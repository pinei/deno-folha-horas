import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

async function getTimesheetByMonth(year, month) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month+1, 0)

    console.log(`Search from ${startDate} to ${endDate}`)

    const response = await api.post('/timesheet/search', {
        startDate: startDate,
        endDate: endDate
    })
    console.log('Response: ', response.data)

    return response.data
}

async function getTimesheetByTerms(category, terms) {
    console.log(`Search for ${category} ${terms}`)
    const response = await api.post('/timesheet/search', {
        category: category,
        terms: terms
    })
    console.log('Response: ', response.data)

    return response.data
}

async function saveRecord(record) {
    console.log('Saving record: ', record)

    const response = await (
        record.id
        ? api.post(`/timesheet/${record.id}`, record)
        : api.post('/timesheet', record)
    )

    console.log('Response: ', response.data)
    return response.data
}

async function deleteRecord(record) {
    console.log('Deleting record: ', record)
    const response = await api.delete(`/timesheet/${record.id}`)

    console.log('Response: ', response.data)
    return response.data
}

export default {
    getTimesheetByMonth,
    getTimesheetByTerms,
    saveRecord,
    deleteRecord,
}