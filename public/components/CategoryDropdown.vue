<template>
    <div :id="dropdownId" class="ui fluid selection dropdown">
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

let _instanceCounter = 0

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

const dropdownId = `dropdown-category-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

const initDropdown = () => {
    if (category.value)
        $(`#${dropdownId}`).dropdown('set selected', category.value, true)
    else
        $(`#${dropdownId}`).dropdown('clear', true)

    $(`#${dropdownId}`).dropdown({
        onChange: (value) => {
            log(`Selected: ${value}`)
            category.value = value
        }
    });
}

watch(() => props.enabled, (newValue, oldValue) => {
    log(`Dropdown enabled: ${newValue} (id: ${dropdownId})`)

    if (newValue) {
        initDropdown()
    }
})

onMounted(() => {
    log(`Mounted (id: ${dropdownId})`)
    // Initialize immediately if already enabled (e.g. added while modal is open)
    if (props.enabled) {
        setTimeout(() => initDropdown(), 50)
    }
})
</script>