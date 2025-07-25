<template>
    <div id="dropdown-category" class="ui fluid selection dropdown">
        <input type="hidden" name="category">
        <i class="dropdown icon"></i>
        <div class="default text">Select Category</div>
        <div class="menu">
            <div class="item" v-for="category in props.categories"
                :key="category" :data-value="category.name">
                <i class="circle icon" :class="[ category.color ]"></i>{{ category.name }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch, defineModel } from 'vue'

const log = (message, object) => {
    if (object)
        console.log(`[CategoryDropdown] ${message}`, object)
    else
        console.log(`[CategoryDropdown] ${message}`)
}

const category = defineModel({ required: true })

const props = defineProps({
    categories: {
        type: Array,
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    }
});

watch(() => props.enabled, (newValue, oldValue) => {
    log(`Dropdown enabled: ${newValue}`)

    // O v-model não funciona com o componente `dropdown` do Fomantic
    // É necessário fazer o controle manual do binding
    if (newValue) {
        if (category.value)
            $('#dropdown-category').dropdown('set selected', category.value, true)
        else
            $('#dropdown-category').dropdown('clear', true)

        $('#dropdown-category').dropdown({
            onChange: (value) => {
                log(`Selected: ${value}`)
                category.value = value
            }
        });
    }
})

onMounted(() => {
    log('Mounted')
})
</script>