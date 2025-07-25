import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

export default {
    async getSAPCodes() {
        const response = await api.get('/sap-codes')
        return response.data
    },
    async addSAPCode(sapCode) {
        const response = await api.post('/sap-codes', sapCode)
        return response.data
    },
    async updateSAPCode(sapCode) {
        const response = await api.post(`/sap-codes/${sapCode.id}`, sapCode)
        return response.data
    },
    async deleteSAPCode(id) {
        const response = await api.delete(`/sap-codes/${id}`)
        return response.data
    },
    async getCategories() {
        const response = await api.get('/sap-codes/categories')
        return response.data
    }
}