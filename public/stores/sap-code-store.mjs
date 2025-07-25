import { defineStore } from 'pinia'
import { ref } from 'vue'
import sapCodesService from '../services/sap-codes-api.mjs'

import { useCategoryStore } from './category-store.mjs'

const categoryStore = useCategoryStore()

export const useSAPCodesStore = defineStore('sapCodes', () => {
  console.log('Setting up SAPCode Store...')
  
  const sapCodes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadSAPCodes() {
    try {
      console.log(':. [SAPCodeStore] Fetching SAP Codes...')

      loading.value = true
      const data = await sapCodesService.getSAPCodes()
      sapCodes.value = data
    } catch (err) {
      error.value = `:. [SAPCodeStore] Erro ao buscar SAP Codes: ${err}`
    }
    finally {
      loading.value = false
    }
  }

  async function addSAPCode(sapCode) {
    try {
      const data = await sapCodesService.addSAPCode(sapCode)
      console.assert(data.id > 0, `ID inválido: ${data.id}`)

      sapCodes.value.push(data)

      await categoryStore.loadCategories()
    } catch (err) {
      throw new Error(':. [SAPCodeStore] Erro ao adicionar SAP Code: ', err)
    }
  }

  async function updateSAPCode(sapCode) {
    try {
      const data = await sapCodesService.updateSAPCode(sapCode)
      console.log(data);
      console.assert(sapCode.id == data.id, `ID mudou: ${sapCode.id} != ${data.id}`)

      const index = sapCodes.value.findIndex((item) => item.id === data.id)
      sapCodes.value[index] = data

      await categoryStore.loadCategories()
    } catch (err) {
      throw new Error(':. [SAPCodeStore] Erro ao atualizar SAP Code: ', err)
    }
  }

  async function mergeSAPCode(sapCode) {
    try {
      loading.value = true
      if (sapCode.id) {
        await updateSAPCode(sapCode)
      }
      else {
        await addSAPCode(sapCode)
      }
    } catch (err) {
      error.value = err
    }
    finally {
      loading.value = false
    }
  }

  async function removeSAPCode(sapCode) {
    try {
      const result = await sapCodesService.deleteSAPCode(sapCode.id)
      
      if (result == true) {
        const index = sapCodes.value.findIndex((item) => item.id === sapCode.id)
        sapCodes.value.splice(index, 1)

        await categoryStore.loadCategories()
      }
    } catch (err) {
      error.value = `:. [SAPCodeStore] Erro ao remover SAP Code: ${err}`
    }
  }

  return {
    sapCodes,
    loadSAPCodes,
    mergeSAPCode,
    removeSAPCode,
  }
})
