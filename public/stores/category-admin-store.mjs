import { defineStore } from 'pinia'
import { ref } from 'vue'
import categoriesService from '../services/categories-api.mjs'
import { useCategoryStore } from './category-store.mjs'

export const useCategoryAdminStore = defineStore('categoryAdmin', () => {
  const categoryStore = useCategoryStore()
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadCategories() {
    try {
      loading.value = true
      error.value = null
      categories.value = await categoriesService.getCategories()
    } catch (err) {
      error.value = `Erro ao buscar Categories: ${err}`
    } finally {
      loading.value = false
    }
  }

  async function mergeCategory(category) {
    try {
      loading.value = true
      error.value = null
      const data = category.id
        ? await categoriesService.updateCategory(category)
        : await categoriesService.addCategory(category)

      const index = categories.value.findIndex((item) => item.id === data.id)
      if (index >= 0) {
        categories.value[index] = data
      } else {
        categories.value.push(data)
      }

      await categoryStore.loadCategories()
    } catch (err) {
      error.value = `Erro ao salvar Category: ${err}`
    } finally {
      loading.value = false
    }
  }

  async function removeCategory(category) {
    try {
      loading.value = true
      error.value = null
      const removed = await categoriesService.deleteCategory(category.id)

      if (removed) {
        const index = categories.value.findIndex((item) => item.id === category.id)
        categories.value.splice(index, 1)
        await categoryStore.loadCategories()
      }
    } catch (err) {
      error.value = `Erro ao remover Category: ${err}`
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    error,
    loadCategories,
    mergeCategory,
    removeCategory,
  }
})