import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

async function getMonthTimesheet(date) {
    console.log('Getting month timesheet report...')

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    const response = await api.get(`/timesheet/report/month-timesheet/${year}/${month}`)
    return response.data
}

async function getFactsAndDeliveries(startMonth, endMonth) {
    console.log('Getting facts and deliveries report...')

    const response = await api.get(`/timesheet/report/facts-and-deliveries`)
    return response.data
}

export default {
    getMonthTimesheet, getFactsAndDeliveries
}