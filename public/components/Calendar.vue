<template>
    <div id="month-calendar" class="ui calendar">
        <div class="ui input left icon">
            <i class="calendar icon"></i>
            <input type="text">
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

/*
 * To declare options like props and emits with full type inference support,
 * we can use the defineProps and defineEmits APIs, which are automatically
 * available inside <script setup>
 */

const props = defineProps({
    modelValue: Date,
    enabled: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['update:modelValue'])

const calendarDate = ref(props.modelValue)

watch(() => props.enabled, (newValue, oldValue) => {
    console.log(`Calendar enabled: ${newValue}`)
    if (newValue) {
        $('#month-calendar').removeClass('disabled')
    } else {
        $('#month-calendar').addClass('disabled')
    }
})

onMounted(() => {
    console.log('[Calendar] Mounted...')

    $('#month-calendar').calendar({
        type: 'month',
        initialDate: calendarDate.value,
        onChange: function (date, text, mode) {
            if (date) {
                calendarDate.value = date
                emit('update:modelValue', date)
            }
        }
    });
})

</script>
