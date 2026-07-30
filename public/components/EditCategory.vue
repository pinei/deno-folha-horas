<template>
	<div id="edit-category" class="ui modal" :class="{ inverted: themeStore.isDark }">
		<i class="close icon"></i>
		<div class="header">{{ state.category.id ? `Category (id=${state.category.id})` : 'Category' }}</div>
		<div class="content">
			<form class="ui form" :class="{ inverted: themeStore.isDark }">
				<section class="form-group">
					<h4 class="ui dividing header">Category</h4>
					<div class="fields">
						<div class="eight wide field" :class="isValidCategory || 'error'">
							<label>Category</label>
							<input type="text" name="category" placeholder="MISC" v-model="state.category.category">
						</div>
						<div class="four wide field">
							<label>Marcação (cor)</label>
							<ColorDropdown v-model="state.category.categoryColor" :enabled="state.isModalVisible"></ColorDropdown>
						</div>
						<div class="four wide field">
							<label>Ativo</label>
							<div class="ui toggle checkbox">
								<input type="checkbox" name="active" v-model="state.category.active" tabindex="0" class="hidden">
							</div>
						</div>
					</div>
                    <NagMessage v-if="state.isModalVisible && isCategoryRenamed" :inverted="themeStore.isDark">
                        Renaming this category will not update existing timesheet records.
                    </NagMessage>
				</section>

				<section class="form-group">
					<h4 class="ui dividing header">SAP</h4>
					<div class="fields">
						<div class="three wide field">
							<label>Tipo Ativ.</label>
							<input type="text" name="tipo_atividade" v-model="state.category.sap.tipoAtividade">
						</div>
						<div class="three wide field">
							<label>Elemento PEP</label>
							<input type="text" name="elemento_pep" v-model="state.category.sap.elementoPep">
						</div>
						<div class="three wide field">
							<label>Diag. Rede</label>
							<input type="text" name="diagrama_rede" v-model="state.category.sap.diagramaRede">
						</div>
						<div class="two wide field">
							<label>Operação</label>
							<input type="text" name="operacao" v-model="state.category.sap.operacao">
						</div>
						<div class="two wide field">
							<label>Sub Oper.</label>
							<input type="text" name="suboperacao" v-model="state.category.sap.subOperacao">
						</div>
						<div class="three wide field">
							<label>Partição</label>
							<input type="text" name="particao" v-model="state.category.sap.particao">
						</div>
					</div>
					<div class="fields">
						<div class="four wide field">
							<label>Centro Trabalho</label>
							<input type="text" name="centro_trabalho" v-model="state.category.sap.centroTrabalho">
						</div>
						<div class="three wide field">
							<label>Centro</label>
							<input type="text" name="centro" v-model="state.category.sap.centro">
						</div>
					</div>
				</section>
			</form>
		</div>
		<SaveCancelRemoveActions
			:visible="state.isModalVisible"
			:disableSave="!isValidCategoryRecord"
			:disableRemove="isNewRecord"
			@save="save"
			@remove="remove"
			@close="close"
			@clone="clone">
		</SaveCancelRemoveActions>
	</div>
</template>

<script setup>
import { defineEmits, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import ColorDropdown from './ColorDropdown.vue'
import NagMessage from './NagMessage.vue'
import { useThemeStore } from '../stores/theme-store.mjs'

const themeStore = useThemeStore()

const emptySAP = () => ({
	tipoAtividade: '', elementoPep: '', diagramaRede: '', operacao: '',
	subOperacao: '', particao: '', centroTrabalho: '', centro: '',
})

const props = defineProps({
	item: { type: Object, required: true },
	visible: { type: Boolean, required: true },
})

const state = reactive({
	category: { sap: emptySAP() },
	originalCategoryName: '',
	isModalVisible: false,
})

watch(() => props.item, (newValue) => {
	state.originalCategoryName = newValue.category ?? ''
	state.category = {
		...newValue,
		sap: { ...emptySAP(), ...newValue.sap },
	}
	$('#edit-category .ui.dropdown').dropdown()
})

watch(() => props.visible, (newValue) => {
	if (newValue && !state.isModalVisible) {
		$('#edit-category').modal('show')
	} else if (!newValue && state.isModalVisible) {
		$('#edit-category').modal('hide')
	}
})

const isNewRecord = computed(() => state.category?.id == null)
const isCategoryRenamed = computed(() => (
	!isNewRecord.value && state.category.category !== state.originalCategoryName
))
const isValidCategory = computed(() => /^\S+$/.test(state.category?.category ?? ''))
const isValidCategoryRecord = computed(() => isValidCategory.value)

const emits = defineEmits(['save', 'remove', 'close', 'clone'])

const save = () => {
	if (isValidCategoryRecord.value) emits('save', state.category)
}
const remove = () => emits('remove', state.category)
const close = () => emits('close', state.category)
const clone = () => emits('clone', state.category)

onMounted(() => {
	$('#edit-category .ui.toggle.checkbox').checkbox()
	$('#edit-category').modal({
		onShow: () => { state.isModalVisible = true },
		onHidden: () => {
			state.isModalVisible = false
			emits('close', state.category)
		},
	})
})

onUnmounted(() => {
	$('.ui.dimmer.modals').remove()
})
</script>

<style scoped>
.form-group + .form-group {
	margin-top: 2rem;
}
</style>