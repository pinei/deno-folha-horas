<template>
    <div class="ui placeholder segment" :class="{ inverted: themeStore.isDark }">
        <div class="ui icon header">
            <i class="search icon"></i>
            Records by month or historical search by category and description
        </div>

        <form class="ui form" id="search-panel" :class="{ inverted: themeStore.isDark }" @submit.prevent>
            <div class="fields">
                <div class="two wide field">
                    <label>Month</label>
                    <Calendar v-model="state.calendarDate" :enabled="calendarEnabled"/>
                </div>
                <div class="six wide field">
                    <label>Categories</label>
                    <MultiCategoryDropdown 
                        v-model="state.selectedCategories" 
                        :categories="availableCategories" 
                        @update:modelValue="$emit('search')" />
                </div>
                <div class="eight wide field">
                    <label>Search text</label>
                    <div class="ui right labeled input" :class="{ inverted: themeStore.isDark }">
                        <input type="text" name="search-text" placeholder="Search terms..." v-model="state.searchText" @keydown.enter="$emit('search')">
                        <div class="ui right attached icon button" :class="{ inverted: themeStore.isDark }" @click="$emit('search')">
                            <i class="search icon"></i>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div></template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import MultiCategoryDropdown from './MultiCategoryDropdown.vue'
import { useCategoryStore } from '../stores/category-store.mjs'
import { useThemeStore } from '../stores/theme-store.mjs'

const categoryStore = useCategoryStore()
const themeStore = useThemeStore()

const props = defineProps({
    modelValue: Object, // { searchText: '', selectedCategories: [], calendarDate: Date }
});

const emit = defineEmits(['search'])

const state = ref(props.modelValue)

const availableCategories = computed(() => categoryStore.categories.map(c => c.name))

/*
 * The computed property is recalculated only if its reactive dependencies
 * have changed since the last evaluation, thanks to Vue's caching system
 */

const calendarEnabled = computed(() => {
    return state.value.searchText === '' && (!state.value.selectedCategories || state.value.selectedCategories.length === 0)
})

watch(() => state.value.calendarDate, (newValue, oldValue) => {
    console.log(`[TimesheetSearchBar] Calendar date changed (search bar): ${newValue}`)
})

watch(() => state.value.searchText, (newValue) => {
    if (newValue === '') {
        emit('search')
    }
})

onMounted(() => {
    categoryStore.loadCategories()
})
</script>