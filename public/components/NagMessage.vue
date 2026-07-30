<template>
	<div ref="nag" class="ui nag" :class="[color, { inverted }]">
		<div class="title"><slot></slot></div>
		<i class="close icon"></i>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

defineProps({
	color: {
		type: String,
		default: 'yellow',
	},
	inverted: {
		type: Boolean,
		default: false,
	},
})

const nag = ref(null)

onMounted(() => {
	$(nag.value).nag({ persist: true })
})
</script>

<style scoped>
.ui.nag {
	margin: 1rem 0 !important;
}
</style>