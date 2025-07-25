import sapCodesService from '../services/sap-codes-api.mjs'
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useCategoryStore = defineStore('categories', () => {
    console.log('Setting up Category Store...')

    const categories = ref([])
    const error = ref(null)

    async function loadCategories() {
    try {
        console.log(':. [SAPCodeStore] Fetching Categories...')
        const data = await sapCodesService.getCategories()
        categories.value = data
    } catch (err) {
        error.value = `:. [SAPCodeStore] Erro ao buscar categorias: ${err}`
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
    }

})

