<template>
    <div :id="dropdownId" class="ui fluid multiple search selection dropdown">
        <input type="hidden" name="categories">
        <i class="dropdown icon"></i>
        <div class="default text">Select Categories</div>
        <div class="menu">
            <div class="item" v-for="category in props.categories" :key="category" :data-value="category">
                <i class="circle icon" :class="categoryColor(category)"></i>{{ category }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch, defineModel, nextTick } from 'vue'
import { useCategoryStore } from '../stores/category-store.mjs'

const categoryStore = useCategoryStore()

const selected = defineModel({ required: true })

const props = defineProps({
    categories: {
        type: Array,
        required: true
    }
});

const dropdownId = `multi-category-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

const categoryColor = (category) => {
    return categoryStore.getCategoryColor(category);
}

const initDropdown = () => {
    $(`#${dropdownId}`).dropdown({
        onChange: (value) => {
            // Em múltiplas seleções, o valor vem como uma string separada por vírgulas
            if (!value) {
                selected.value = [];
            } else {
                selected.value = value.split(',');
            }
        }
    });
}

watch(() => props.categories, async () => {
    await nextTick();
    $(`#${dropdownId}`).dropdown('refresh');
}, { deep: true });

watch(selected, async (newVal) => {
    await nextTick();
    const currentVal = $(`#${dropdownId}`).dropdown('get value') || '';
    const currentOptions = currentVal ? currentVal.split(',') : [];
    
    // Atualiza o componente apenas se houver diferença real para evitar loops
    if (newVal.join(',') !== currentOptions.join(',')) {
        $(`#${dropdownId}`).dropdown('set exactly', newVal);
    }
}, { deep: true });

onMounted(async () => {
    await categoryStore.loadCategories();
    initDropdown();
    if (selected.value && selected.value.length > 0) {
        $(`#${dropdownId}`).dropdown('set exactly', selected.value);
    }
})
</script>
