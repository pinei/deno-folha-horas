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
    let url = `/timesheet/report/facts-and-deliveries`
    let queryParams = []

    if (startMonth && startMonth instanceof Date && !isNaN(startMonth.getTime())) {
        const startStr = `${startMonth.getFullYear()}-${(startMonth.getMonth() + 1).toString().padStart(2, '0')}`
        queryParams.push(`startMonthStr=${startStr}`)
    }

    if (endMonth && endMonth instanceof Date && !isNaN(endMonth.getTime())) {
        const endStr = `${endMonth.getFullYear()}-${(endMonth.getMonth() + 1).toString().padStart(2, '0')}`
        queryParams.push(`endMonthStr=${endStr}`)
    }

    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&')
    }

    console.log(`Getting facts and deliveries report... URL: ${url}`)

    const response = await api.get(url)
    return response.data
}

export default {
    getMonthTimesheet, getFactsAndDeliveries
}