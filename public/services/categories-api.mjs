import axios from 'axios'

const api = axios.create({
    baseURL: '/api/categories',
})

export default {
    async getCategories() {
        const response = await api.get('/')
        return response.data
    },
    async addCategory(category) {
        const response = await api.post('/', category)
        return response.data
    },
    async updateCategory(category) {
        const response = await api.post(`/${category.id}`, category)
        return response.data
    },
    async deleteCategory(id) {
        const response = await api.delete(`/${id}`)
        return response.data
    },
    async getActiveCategories() {
        const response = await api.get('/active')
        return response.data
    }
}