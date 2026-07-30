import categoriesService from '../services/categories-api.mjs'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCategoryStore = defineStore('categories', () => {
    console.log('Setting up Category Store...')

    const categories = ref([])
        const loading = ref(false)
        const loaded = ref(false)
    const error = ref(null)

    async function loadCategories() {
            try {
        console.log(':. [CategoryStore] Fetching Categories...')
                loading.value = true
        const data = await categoriesService.getActiveCategories()
        categories.value = data
            } catch (err) {
        error.value = `:. [CategoryStore] Erro ao buscar categorias: ${err}`
            } finally {
                loading.value = false
                loaded.value = true
            }
    }

    function getCategoryColor(name) {
        const category = categories.value.find((item) => item.name === name)
        return category ? category.color : 'gray'
    }

    return {
    loadCategories,
    getCategoryColor,
    categories,
    loading,
    loaded,
    }

})

