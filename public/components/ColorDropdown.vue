<template>
    <div id="dropdown-color" class="ui fluid selection dropdown">
        <input type="hidden" name="color">
        <i class="dropdown icon"></i>
        <div class="default text">Select Color</div>
        <div class="menu">
            <div class="item" data-value="red"><i class="red circle icon"></i>Red</div>
            <div class="item" data-value="orange"><i class="orange circle icon"></i>Orange</div>
            <div class="item" data-value="yellow"><i class="yellow circle icon"></i>Yellow</div>
            <div class="item" data-value="olive"><i class="olive circle icon"></i>Olive</div>
            <div class="item" data-value="green"><i class="green circle icon"></i>Green</div>
            <div class="item" data-value="teal"><i class="teal circle icon"></i>Teal</div>
            <div class="item" data-value="blue"><i class="blue circle icon"></i>Blue</div>
            <div class="item" data-value="violet"><i class="violet circle icon"></i>Violet</div>
            <div class="item" data-value="purple"><i class="purple circle icon"></i>Purple</div>
            <div class="item" data-value="pink"><i class="pink circle icon"></i>Pink</div>
            <div class="item" data-value="brown"><i class="brown circle icon"></i>Brown</div>
            <div class="item" data-value="grey"><i class="grey circle icon"></i>Grey</div>
            <div class="item" data-value="black"><i class="black circle icon"></i>Black</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch, defineModel } from 'vue'

const log = (message, object) => {
    if (object)
        console.log(`[ColorDropdown] ${message}`, object)
    else
        console.log(`[ColorDropdown] ${message}`)
}

const color = defineModel({ required: true })

const props = defineProps({
    enabled: {
        type: Boolean,
        default: false
    }
});

watch(() => props.enabled, (newValue, oldValue) => {
    log(`Dropdown enabled: ${newValue}`)

    if (newValue) {
        if (color.value)
            $('#dropdown-color').dropdown('set selected', color.value, true)
        else
            $('#dropdown-color').dropdown('clear', true)

        $('#dropdown-color').dropdown({
            onChange: (value) => {
                log(`Selected: ${value}`)
                color.value = value
            }
        });
    }
})

onMounted(() => {
    log('Mounted')
})

</script>