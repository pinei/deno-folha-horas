<template>
	<h1>Categories</h1>
	<div class="categories-table-wrapper">
		<table class="ui selectable compact celled table tabbed">
			<thead>
				<tr class="tab-row">
					<th colspan="2"></th>
					<th colspan="8" class="center aligned tab-cell blue">
						<div class="ui blue label">SAP</div>
					</th>
				</tr>
				<tr>
					<th>Status</th>
					<th>Category</th>
					<th>Tipo Ativ.</th>
					<th>Elemento PEP</th>
					<th>Diagrama Rede</th>
					<th>Op.</th>
					<th>Subop.</th>
					<th>Part.</th>
					<th>Centro Trabalho</th>
					<th>Centro</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="category in categoryAdminStore.categories" :key="category.id" @click="editCategory(category)">
					<td>
						<i v-if="category.active" class="check circle outline icon"></i>
						<i v-else class="circle outline icon"></i>
					</td>
					<td>
						<a v-if="category.categoryColor" class="ui empty circular label" :class="[category.categoryColor]"></a>
						{{ category.category }}
					</td>
					<td>{{ category.sap.tipoAtividade }}</td>
					<td>{{ category.sap.elementoPep }}</td>
					<td>{{ category.sap.diagramaRede }}</td>
					<td>{{ category.sap.operacao }}</td>
					<td>{{ category.sap.subOperacao }}</td>
					<td>{{ category.sap.particao }}</td>
					<td>{{ category.sap.centroTrabalho }}</td>
					<td>{{ category.sap.centro }}</td>
				</tr>
			</tbody>
		</table>
	</div>
	<button class="ui right floated mini primary circular icon button" @click="addCategory" data-tooltip="Adicionar">
		<i class="plus icon"></i>
	</button>
	<EditCategory
		:item="state.selectedCategory"
		:visible="state.isModalVisible"
		@save="saveCategory"
		@close="closeModal"
		@remove="removeCategory"
		@clone="cloneCategory">
	</EditCategory>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useCategoryAdminStore } from '../stores/category-admin-store.mjs'

const emptyCategory = () => ({
	id: null,
	category: '',
	categoryColor: null,
	active: true,
	sap: {
		tipoAtividade: '',
		elementoPep: '',
		diagramaRede: '',
		operacao: '',
		subOperacao: '',
		particao: '',
		centroTrabalho: '',
		centro: '',
	},
})

const copyCategory = (category) => ({
	...category,
	sap: { ...category.sap },
})

const categoryAdminStore = useCategoryAdminStore()
const state = reactive({
	selectedCategory: emptyCategory(),
	isModalVisible: false,
})

const addCategory = () => {
	state.selectedCategory = emptyCategory()
	state.isModalVisible = true
}

const editCategory = (category) => {
	state.selectedCategory = copyCategory(category)
	state.isModalVisible = true
}

const saveCategory = async (category) => {
	await categoryAdminStore.mergeCategory(category)
	state.isModalVisible = false
}

const removeCategory = async (category) => {
	await categoryAdminStore.removeCategory(category)
	state.isModalVisible = false
}

const closeModal = (category) => {
	state.selectedCategory = copyCategory(category)
	state.isModalVisible = false
}

const cloneCategory = (category) => {
	state.selectedCategory = copyCategory(category)
	state.selectedCategory.id = null
}

onMounted(async () => {
	if (categoryAdminStore.categories.length === 0) {
		await categoryAdminStore.loadCategories()
	}
})
</script>

<style scoped>
.categories-table-wrapper {
	overflow-x: auto;
	margin-bottom: 1rem;
}
</style>