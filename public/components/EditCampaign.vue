<template>
	<div id="edit-campaign" class="ui modal">
	  <i class="close icon"></i>
	  <div class="header">{{ state.campaign.id ? `Campaign (id=${state.campaign.id})` : "Nova Campaign" }}</div>
	  <div class="content">
		<form class="ui form">
			<div class="field" :class="isValidName || 'error'">
				<label>Nome / Título</label>
				<input type="text" name="name" v-model="state.campaign.name">
			</div>
			
			<div class="fields">
				<div class="six wide field" :class="isValidType || 'error'">
					<label>Tipo</label>
					<select class="ui dropdown" name="type" v-model="state.campaign.type" id="campaign-type-dropdown">
						<option value="">Selecione...</option>
						<option value="Project">Project</option>
						<option value="Epic">Epic</option>
						<option value="Release">Release</option>
						<option value="Feature">Feature</option>
						<option value="Package">Package</option>
						<option value="Sprint">Sprint</option>
					</select>
				</div>
				<div class="five wide field">
					<label>Data Início</label>
					<div class="ui calendar" id="campaign-start-calendar">
						<div class="ui input left icon">
							<i class="calendar icon"></i>
							<input type="text" placeholder="Data Inicial" name="startDate">
						</div>
					</div>
				</div>
				<div class="five wide field">
					<label>Data Fim</label>
					<div class="ui calendar" id="campaign-end-calendar">
						<div class="ui input left icon">
							<i class="calendar icon"></i>
							<input type="text" placeholder="Data Final" name="endDate">
						</div>
					</div>
				</div>
			</div>

			<div class="field">
				<label>Descrição</label>
				<textarea name="description" rows="3" v-model="state.campaign.description"></textarea>
			</div>

			<div class="field" v-show="!isNewCampaign">
				<label>Arquivado</label>
				<div class="ui toggle checkbox" id="campaign-archived-checkbox">
					<input type="checkbox" name="archived" v-model="state.campaign.archived">
					<label></label>
				</div>
			</div>
		</form>
	  </div>

	  <SaveCancelRemoveActions
	   :visible="visible" :disableSave="!isValidCampaign" :disableRemove="isNewCampaign"
	   @save="save" @remove="remove" @close="close" @clone="clone"></SaveCancelRemoveActions>
	</div>
</template>

<script setup>
import { defineEmits, defineModel, computed, watch, onMounted, onUnmounted, reactive } from 'vue';

const log = (message, object) => {
	if (object)
		console.log(`[EditCampaign] ${message}`, object)
	else
		console.log(`[EditCampaign] ${message}`)
}

/* Properties */
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  visible: {
	type: Boolean,
	required: true,
  }
});

/* Model */
const visible = defineModel('visible', { type: Boolean, required: true })

/* State */
const state = reactive({
	campaign: {},
	isModalVisible: false,
});

/* Watches */
watch(() => props.item, (newValue) => {
	log(`Campaign changed:`, newValue)
	state.campaign = { ...newValue };

	// Sync semantic UI elements
	setTimeout(() => {
		$('#campaign-type-dropdown').dropdown('set selected', state.campaign.type || '');
		
		if (state.campaign.startDate) {
			const d = new Date(state.campaign.startDate.replace(/-/g, '/'))
			$('#campaign-start-calendar').calendar('set date', d, true, false);
		} else {
			$('#campaign-start-calendar').calendar('clear');
		}

		if (state.campaign.endDate) {
			const d = new Date(state.campaign.endDate.replace(/-/g, '/'))
			$('#campaign-end-calendar').calendar('set date', d, true, false);
		} else {
			$('#campaign-end-calendar').calendar('clear');
		}

		if (state.campaign.archived) {
			$('#campaign-archived-checkbox').checkbox('set checked');
		} else {
			$('#campaign-archived-checkbox').checkbox('set unchecked');
		}
	}, 100);
});

watch(visible, (newValue) => {
	log(`Modal visible changed: ${newValue} and isModalVisible = ${state.isModalVisible}`)

	if (newValue == true) {
		if (!state.isModalVisible) {
			$('#edit-campaign').modal('show');
		}
	} else {
		if (state.isModalVisible)
			$('#edit-campaign').modal('hide');
	}
})

/* Computed */
const isNewCampaign = computed(() => {
	return state.campaign?.id == null;
});

const isValidName = computed(() => {
	return (state.campaign?.name?.trim().length > 0)
})

const isValidType = computed(() => {
	return (state.campaign?.type?.trim().length > 0)
})

const isValidCampaign = computed(() => {
	return isValidName.value && isValidType.value;
});

/* Events */
const emits = defineEmits(['save', 'remove', 'close', 'clone'])

const save = () => {
	if (isValidCampaign.value) {
		log('Saving...')
		emits('save', state.campaign);
	}
};

const remove = () => {
	emits('remove', state.campaign);
};

const close = () => {
	visible.value = false;
	emits('close', state.campaign);
};

const clone = () => {
	emits('clone', state.campaign);
}

/* Lifecycle */
const clearDOM = () => {
    $('.ui.dimmer.modals').remove()
}

onMounted(() => {
	log('Mounted...')

	const modalOptions = {
		onShow: () => { state.isModalVisible = true; },
		onHidden: () => {
			state.isModalVisible = false;
			visible.value = false; 
			emits('close', state.campaign);
		}
	};

	$('#edit-campaign').modal(modalOptions);
	$('#campaign-type-dropdown').dropdown({
		onChange: function(value) {
			state.campaign.type = value;
		}
	});

	const calOptions = (field) => ({
		type: 'date',
		formatter: {
			date: (date) => {
				if (!date) return '';
				const day = date.getDate();
				const month = date.getMonth() + 1;
				const year = date.getFullYear();
				return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			}
		},
		onChange: (date) => {
			if (date) {
				state.campaign[field] = date.toISOString().substring(0, 10);
			} else {
				state.campaign[field] = null;
			}
		}
	})

	$('#campaign-start-calendar').calendar(calOptions('startDate'));
	$('#campaign-end-calendar').calendar(calOptions('endDate'));

	$('#campaign-archived-checkbox').checkbox({
		onChange: function() {
			state.campaign.archived = $(this).is(':checked');
		}
	});
});

onUnmounted(() => {
	clearDOM()
});
</script>
