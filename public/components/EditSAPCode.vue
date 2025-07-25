<template>
	<div id="edit-sap-code" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">{{ state.sapCode.id ? `SAP Code (id=${state.sapCode.id})` : "SAP Code" }}</div>
	  <div class="content">
		<form class="ui form">
		<div class="fields">
			<div class="eight wide field" :class="isValidCategory || 'error'">
				<label>Categoria</label>
			<input type="text" name="category" placeholder="MISC" v-model="state.sapCode.category">
			</div>
			<div class="four wide field">
				<label>Marcação (cor)</label>
				<ColorDropdown v-model="state.sapCode.categoryColor" :enabled="state.isModalVisible"></ColorDropdown>
			</div>
		</div>
		<div class="field" :class="isValidCategory || 'error'">
		</div>
		<div class="fields">
			<div class="three wide field" :class="isValidTipoAtividade || 'error'">
				<label>Tipo Ativ.</label>
				<input type="text" name="tipo_atividade" v-model="state.sapCode.tipoAtividade">
			</div>
			<div class="three wide field">
				<label>Elemento PEP</label>
				<input type="text" name="elemento_pep" v-model="state.sapCode.elementoPep">
			</div>
			<div class="three wide field">
				<label>Diag. Rede</label>
				<input type="text" name="diagrama_rede" v-model="state.sapCode.diagramaRede">
			</div>
			<div class="two wide field">
				<label>Operação</label>
				<input type="text" name="operacao" v-model="state.sapCode.operacao">
			</div>
			<div class="two wide field">
				<label>Sub Oper.</label>
				<input type="text" name="suboperacao" v-model="state.sapCode.subOperacao">
			</div>
			<div class="two wide field">
				<label>Partição</label>
				<input type="text" name="tipo_atividade" v-model="state.sapCode.particao">
			</div>
		</div>
		<div class="fields">
			<div class="three wide field" :class="isValidCentroTrabalho || 'error'">
				<label>Centro Trabalho</label>
				<input type="text" name="centro_trabalho" v-model="state.sapCode.centroTrabalho">
			</div>
			<div class="two wide field" :class="isValidCentro || 'error'">
				<label>Centro</label>
				<input type="text" name="centro" v-model="state.sapCode.centro">
			</div>
		</div>
		<div class="field">
			<label>Ativo</label>
			<div class="ui toggle checkbox">
				<input type="checkbox" name="active" v-model="state.sapCode.active" tabindex="0" class="hidden">
			</div>
		</div>
		</form>
	  </div>
	  <SaveCancelRemoveActions
	  	:visible="state.isModalVisible" :disableSave="!isValidSAPCode" :disableRemove="isNewRecord"
		@save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>

</template>

<script setup>
import { defineEmits, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import ColorDropdown from './ColorDropdown.vue';

const log = (message, object) => {
	if (object)
		console.log(`[EditSAPCode] ${message}`, object)
	else
		console.log(`[EditSAPCode] ${message}`)
}

/* Properties */

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  visible: {
	type: Boolean,
	required: true,
  }
});

/* State */

const state = reactive({
	sapCode: {},
	isModalVisible: false
});

/* Watches */

watch(() => props.item, (newValue) => {
	log(`SAP Code changed: ${JSON.stringify(newValue)}`)
	state.sapCode = newValue;

	$('#edit-sap-code .ui.dropdown').dropdown();
});

watch(() => props.visible, (newValue) => {
	log(`Modal visible changed: ${newValue} and isModalVisible = ${state.isModalVisible}`)

	if (newValue == true) {
		if (!state.isModalVisible)
			$('#edit-sap-code').modal('show');
	} else {
		if (state.isModalVisible)
			$('#edit-sap-code').modal('hide');
	}
});

/* Computed */

const isNewRecord = computed(() => {
	return state.sapCode?.id == null;
});

const isValidCategory = computed(() => {
	return state.sapCode?.category?.trim().length > 0
});

const isValidTipoAtividade = computed(() => {
	return state.sapCode?.tipoAtividade?.trim().length > 0
});

const isValidCentroTrabalho = computed(() => {
	return state.sapCode?.centroTrabalho?.trim().length > 0
});

const isValidCentro = computed(() => {
	return state.sapCode?.centro?.trim().length > 0
});

const isValidSAPCode = computed(() => {
	return isValidCategory.value && isValidTipoAtividade.value && isValidCentroTrabalho.value && isValidCentro.value
});

/* Events */

const emits = defineEmits(['save', 'remove', 'close', 'clone']);

const save = () => {
	if (isValidSAPCode.value) {
		log('Saving...')
		emits('save', state.sapCode);
	}
	else {
		log('SAP Code is not valid')
	}
};

const remove = () => {
	log('Removing...')
	emits('remove', state.sapCode);
};

const close = () => {
	log('Closing...')
	emits('close', state.sapCode);
};

const clone = () => {
	log('Cloning...')
	emits('clone', state.sapCode);
};

/* Lifecycle */

const clearDOM = () => {
    log('Clearing DOM...')

    // Elemento criado pela biblioteca Fomantic UI para a modal
    // causa problema no reuso em múltiplos paineis
    $('.ui.dimmer.modals').remove()
}

onMounted(() => {
	log('Mounted...')

	$('.ui.toggle.checkbox').checkbox();

	const modalOptions = {
		onShow: () => {
			state.isModalVisible = true;
		},
		onHidden: () => {
			state.isModalVisible = false;
			emits('close', state.sapCode);
		}
	}

	// Inicialização do componente de ações
	$('#edit-sap-code').modal(modalOptions);

});

onUnmounted(() => {
    console.log('Unmounted...')
    clearDOM()
});
</script>