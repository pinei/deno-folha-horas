<template>
	<h1>Códigos do SAP</h1>
	<table class="ui selectable compact celled table">
		<thead>
		<tr>
			<th>Status</th>
			<th>Categoria</th>
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
		<tr v-for="sapCode in sapCodeStore.sapCodes" :key="sapCode.id" @click="editSAPCode(sapCode)">
			<td>
				<span v-show="sapCode.active"><i class="check circle outline icon"></i></span>
				<span v-show="!sapCode.active"><i class="circle outline icon"></i></span>
			</td>
			<td><a v-if="sapCode.categoryColor" class="ui empty circular label" :class="[sapCode.categoryColor]"></a> {{ sapCode.category }}</td>
			<td>{{ sapCode.tipoAtividade }}</td>
			<td>{{ sapCode.elementoPep }}</td>
			<td>{{ sapCode.diagramaRede }}</td>
			<td>{{ sapCode.operacao }}</td>
			<td>{{ sapCode.subOperacao }}</td>
			<td>{{ sapCode.particao }}</td>
			<td>{{ sapCode.centroTrabalho }}</td>
			<td>{{ sapCode.centro }}</td>
		</tr>
	  </tbody>
	</table>
	<button class="ui right floated mini primary circular icon button" @click="addSAPCode()" data-tooltip="Adicionar">
		<i class="plus icon"></i>
	</button>
  <EditSAPCode :item="state.selectedSAPCode" :visible="state.isModalVisible" @save="saveSAPCode" @close="closeModal" @remove="removeSAPCode" @clone="cloneSAPCode"></EditSAPCode>

</template>

<script setup>
import { reactive, onMounted, } from 'vue';
import { useSAPCodesStore } from '../stores/sap-code-store.mjs'

const log = (message, object) => {
	if (object)
		console.log(`[SAPCodes] ${message}`, object)
	else
		console.log(`[SAPCodes] ${message}`)
}

log('Setting up...')

/* State */

const sapCodeStore = useSAPCodesStore();

const state = reactive({
	selectedSAPCode: {},
	isModalVisible: false
})

/* Methods */

const addSAPCode = async () => {
	state.selectedSAPCode = {}

	log('New SAP code:', state.selectedSAPCode)
	state.isModalVisible = true
};

const editSAPCode = async (sapCode) => {
	// clone para evitar alteração indevida no Store antes de confirmação de OK do usuário
	state.selectedSAPCode = {...sapCode}
	log('Editing SAP code:', state.selectedSAPCode)
	state.isModalVisible = true
};

/* Events */

const saveSAPCode = async (sapCode) => {
	log('Saving SAP code:', sapCode)
	sapCodeStore.mergeSAPCode(sapCode)
	state.isModalVisible = false
};

const removeSAPCode = async (sapCode) => {
	log('Removing SAP code:', sapCode)
	sapCodeStore.removeSAPCode(sapCode)
	state.isModalVisible = false
};

const closeModal = (sapCode) => {
	log('Modal closed...')
	state.selectedSAPCode = sapCode; // permite recuperar o estado após fechar a janela de edição
	state.isModalVisible = false
}

const cloneSAPCode = (sapCode) => {
	log('Cloning SAP code:', sapCode)
	state.selectedSAPCode = {...sapCode};
	state.selectedSAPCode.id = null;
}

/* Lifecycle */

onMounted(async () => {
	log('Mounted...')

	if (sapCodeStore.sapCodes.length == 0) {
		await sapCodeStore.loadSAPCodes();
	}
});

</script>
