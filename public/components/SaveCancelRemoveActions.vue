<template>
    <div class="actions main" >
        <div class="ui secondary left floated button" @click="cancel()">Cancelar</div>
        <div v-show="!props.disableRemove" class="ui red right labeled icon button" @click="handleRemove()">Remover <i class="trash icon"></i></div>
        <div v-show="!props.disableRemove" class="ui secondary right labeled icon button" @click="clone()">Clonar <i class="copy outline icon"></i></div>
        <div :class="{ disabled: props.disableSave }" class="ui primary right labeled icon button" @click="save()">Salvar <i class="checkmark icon"></i></div>
    </div>
    <div class="actions remove">
        <div class="ui secondary left floated button" @click="cancelRemove()">Cancelar</div>
        <div class="ui red right labeled icon button" @click="confirmRemove()">Confirmar <i class="trash icon"></i></div>
    </div>
</template>

<script setup>
import { defineEmits, watch, onMounted, onBeforeUnmount } from 'vue';

/* Properties */

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  disableRemove: {
    type: Boolean,
    default: false
  },
  disableSave: {
    type: Boolean,
    default: false
  }
});

/* Watches */

watch(() => props.visible, (newValue) => {
    console.log(`[SaveCancelRemoveActions] visible: ${newValue}`)
    if (newValue == true) {
        // Inicialização para visualização
        $('.actions.main').transition('show')
        $('.actions.remove').transition('hide')
    }
});

/* Events */

const emits = defineEmits(['save', 'close', 'remove', 'clone'])

const save = () => {
    emits('save');
};

const cancel = () => {
    emits('close');
};

const confirmRemove = () => {
    emits('remove');
}

const clone = () => {
    emits('clone');
}

const handleRemove = () => {
    // Habilita confirmação de remoção
    $('.actions.main').transition('hide')
    $('.actions.remove').transition('slide up')
};

const cancelRemove = () => {
    // Desabilita confirmação de remoção
    $('.actions.remove').transition('hide')
    $('.actions.main').transition('slide down')
}

/* Lifecycle */

onMounted(() => {
    console.log(`[SaveCancelRemoveActions] Mounted...`)
    $('.actions.main').transition('show')
    $('.actions.remove').transition('hide')

    // Adiciona listener para Control+Enter
    window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
});

/* Keyboard Event */

const handleKeyDown = (event) => {
    if (event.ctrlKey
        && event.key === 'Enter'
        && !props.disableSave
        && props.visible) {
        save();
    }
};

</script>