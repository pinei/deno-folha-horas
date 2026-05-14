<template>
    <div class="ui placeholder segment">
        <div class="ui icon header">
            <i class="search icon"></i>
            Records by month or historical search by category and description
        </div>

        <form class="ui form" id="search-panel">
        <div class="two fields">
            <div class="four wide field">
                <label>Month</label>
                <Calendar v-model="state.calendarDate" :enabled="calendarEnabled"/>
            </div>
            <div class="twelve wide field">
                <label>Description</label>
                <div class="ui right labeled input">
                    <input type="text" name="search-text" placeholder="category:MISC reunião" v-model="state.searchText">
                    <div class="ui right attached icon button" @click="$emit('search')">
                        <i class="search icon"></i>
                    </div>
                </div>
            </div>
        </div>
        </form>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    modelValue: Object, // { searchText: '', calendarDate: Date }
});

const state = ref(props.modelValue)

/*
 * The computed property is recalculated only if its reactive dependencies
 * have changed since the last evaluation, thanks to Vue's caching system
 */

const calendarEnabled = computed(() => {
    return state.value.searchText === ''
})

watch(() => state.value.calendarDate, (newValue, oldValue) => {
    console.log(`[TimesheetSearchBar] Calendar date changed (search bar): ${newValue}`)
})

</script>