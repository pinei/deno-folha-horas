<template>
    <div class="ui placeholder segment">
        <div class="ui icon header">
            <i class="search icon"></i>
            Records by month or historical search by category and description
        </div>

        <form class="ui form" id="search-panel" @submit.prevent>
            <div class="two fields">
                <div class="four wide field">
                    <label>Month</label>
                    <Calendar v-model="state.calendarDate" :enabled="calendarEnabled"/>
                </div>
                <div class="twelve wide field">
                    <label>Categories</label>
                    <MultiCategoryDropdown 
                        v-model="state.selectedCategories" 
                        :categories="availableCategories" 
                        @update:modelValue="$emit('search')" />
                </div>
            </div>
            <div class="field">
                <label>Description</label>
                <div class="ui right labeled input">
                    <input type="text" name="search-text" placeholder="Search terms..." v-model="state.searchText" @keydown.enter="$emit('search')">
                    <div class="ui right attached icon button" @click="$emit('search')">
                        <i class="search icon"></i>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import MultiCategoryDropdown from './MultiCategoryDropdown.vue'
import { useCategoryStore } from '../stores/category-store.mjs'

const categoryStore = useCategoryStore()

const props = defineProps({
    modelValue: Object, // { searchText: '', selectedCategories: [], calendarDate: Date }
});

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

onMounted(() => {
    categoryStore.loadCategories()
})
</script>