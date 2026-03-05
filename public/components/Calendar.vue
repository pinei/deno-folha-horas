<template>
    <div ref="calendarEl" class="ui calendar">
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
const calendarEl = ref(null)

watch(() => props.enabled, (newValue, oldValue) => {
    console.log(`Calendar enabled: ${newValue}`)
    if (newValue) {
        $(calendarEl.value).removeClass('disabled')
    } else {
        $(calendarEl.value).addClass('disabled')
    }
})

onMounted(() => {
    console.log('[Calendar] Mounted...')

    $(calendarEl.value).calendar({
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
