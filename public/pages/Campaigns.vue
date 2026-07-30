<template>
    <div class="ui container campaigns-container">
        <EditCampaign
            :item="selectedCampaign"
            v-model:visible="isCampaignModalVisible"
            @close="closeCampaignModal"
            @save="saveCampaign"
            @remove="removeCampaign"
        />
        
        <EditKanbanCard 
            :item="selectedCard" 
            v-model:visible="isCardModalVisible"
            @close="closeCardModal" 
            @save="saveCard"
            @clone="cloneCard"
        />

        <h1 class="ui header" style="display: flex; justify-content: space-between; align-items: center;">
            Campaigns
            <button class="ui primary circular icon button" @click="addCampaign">
                <i class="plus icon"></i>
            </button>
        </h1>
        
        <div class="ui segment mural" :class="{ inverted: themeStore.isDark }" v-for="bucket in campaignStore.buckets.getBuckets()" :key="bucket.name">
            <div class="ui grid">
                <!-- 4 wide for Campaign info -->
                <div class="four wide column campaign-info-col">
                    <div class="ui fluid card borderless-card" @click="editCampaign(bucket.campaign)" style="cursor: pointer; box-shadow: none; border: none; background: transparent;">
                        <div class="content">
                            <div class="header" style="font-size: 1.5em; margin-bottom: 0.5em;">{{ bucket.campaign.name }}</div>
                            <div class="meta" style="margin-bottom: 1em;">
                                <span class="ui blue label">{{ bucket.campaign.type }}</span>
                            </div>
                            <div class="description">
                                <p v-for="(line, index) in parseDescription(bucket.campaign.description)" :key="'cd'+index">
                                    <span v-html="line"></span>
                                </p>
                            </div>
                        </div>
                        <div class="extra content" v-if="bucket.campaign.startDate || bucket.campaign.endDate" style="border-top: none; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="flex: 1; text-align: left;">
                                <span v-if="bucket.campaign.startDate" data-tooltip="Data de início" data-position="top left">
                                    <i class="hourglass start icon"></i>{{ bucket.campaign.startDate }}
                                </span>
                            </div>
                            
                            <div style="flex: 0 0 auto; text-align: center; padding: 0 0.5em;">
                                <span v-if="getCampaignDurationDays(bucket.campaign) !== null" class="ui grey basic label" :class="{ inverted: themeStore.isDark }">
                                    {{ getCampaignDurationDays(bucket.campaign) }} days
                                </span>
                            </div>
                            
                            <div style="flex: 1; text-align: right;">
                                <span v-if="bucket.campaign.endDate" data-tooltip="Data de término" data-position="top right">
                                    <i class="hourglass end icon"></i>{{ bucket.campaign.endDate }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 12 wide for Kanban Cards -->
                <div class="twelve wide column">
                    <div class="ui segment horizontal-lane" :class="{ inverted: themeStore.isDark }"
                         v-for="lane in [
                             { key: 'TO_DO', label: 'To Do' },
                             { key: 'IN_PROGRESS', label: 'In Progress' },
                             { key: 'AWAITING', label: 'Awaiting' },
                             { key: 'DONE', label: 'Done' }
                         ]"
                         :key="lane.key"
                         :style="laneStyle(lane)"
                         @drop="onDrop($event, lane.key, bucket.name)" 
                         @dragover.prevent 
                         @dragenter.prevent>
                        <h3 class="ui dividing header" style="display: flex; justify-content: space-between; align-items: center;">
                            {{ lane.label }}
                            <div class="ui custom-add-button">
                                <button class="ui mini primary circular icon button" data-tooltip="Add" @click="addCard(bucket.campaign.id, lane.key)">
                                    <i class="plus icon"></i>
                                </button>
                            </div>
                        </h3>

                        <div class="ui cards">
                            <KanbanCard
                                v-for="card in getCardsByStatus(bucket, lane.key)" :key="card.id"
                                :card="card"
                                draggable="true"
                                @dragstart="startDrag($event, card.id, bucket.name)"
                                @drag="onDrag($event)"
                                @dragend="endDrag($event)"
                                @click="editCard(card)"
                                :class="{ 'is-dragging': draggedCardId === card.id }"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useCampaignStore } from '../stores/campaign-store.mjs'
import { useThemeStore } from '../stores/theme-store.mjs'
import EditCampaign from '../components/EditCampaign.vue'
import EditKanbanCard from '../components/EditKanbanCard.vue'
import KanbanCard from '../components/KanbanCard.vue'
import { useParseDescription } from '../composables/useParseDescription.mjs'
import { useKanbanDragAndDrop } from '../composables/useKanbanDragAndDrop.mjs'

export default {
    name: 'Campaigns',
    components: {
        EditCampaign,
        EditKanbanCard,
        KanbanCard
    },
    setup() {
        const { parseDescription } = useParseDescription();
        const dragAndDrop = useKanbanDragAndDrop();
        const themeStore = useThemeStore();
        return { parseDescription, dragAndDrop, draggedCardId: dragAndDrop.draggedCardId, themeStore };
    },
    data() {
        return {
            campaignStore: useCampaignStore(),
            isCampaignModalVisible: false,
            selectedCampaign: {},
            isCardModalVisible: false,
            selectedCard: {},
            draggedFromBucketName: null
        }
    },
    methods: {
        addCampaign() {
            this.selectedCampaign = {};
            this.isCampaignModalVisible = true;
        },
        editCampaign(campaign) {
            this.selectedCampaign = { ...campaign };
            this.isCampaignModalVisible = true;
        },
        async saveCampaign(campaign) {
            await this.campaignStore.saveCampaign(campaign);
            this.isCampaignModalVisible = false;
            this.selectedCampaign = {};
        },
        async removeCampaign(campaign) {
            await this.campaignStore.deleteCampaign(campaign);
            this.isCampaignModalVisible = false;
            this.selectedCampaign = {};
        },
        closeCampaignModal() {
            this.isCampaignModalVisible = false;
        },

        addCard(campaignId, status) {
            this.selectedCard = {
                campaignId: campaignId,
                status: status
            };
            this.isCardModalVisible = true;
        },
        editCard(card) {
            this.selectedCard = { ...card };
            this.isCardModalVisible = true;
        },
        saveCard(card) {
            // we delegate saving to kanban store or do it here?
            // Actually campaignStore has saveKanbanCard? No, we used kanbanApi.saveKanbanCard inside moveCard.
            // Let's implement saveCard via kanban store or API.
            import('../services/kanban-api.mjs').then(module => {
                const kanbanApi = module.default;
                kanbanApi.saveKanbanCard(card).then(() => {
                    this.campaignStore.loadCampaignsBoard();
                })
            })
            this.isCardModalVisible = false;
            this.selectedCard = {};
        },
        closeCardModal() {
            this.isCardModalVisible = false;
        },
        cloneCard(card) {
            this.selectedCard = { ...card, id: null };
            this.selectedCard.timesheets = [];
        },

        getCardsByStatus(bucket, status) {
            const cluster = bucket.clusters.findCluster(status);
            return cluster ? cluster.items : [];
        },

        startDrag(evt, cardId, bucketName) {
            evt.dataTransfer.setData('cardId', cardId);
            evt.dataTransfer.setData('bucketName', bucketName);
            this.draggedFromBucketName = bucketName;
            
            this.dragAndDrop.startVisualDrag(evt, cardId);
        },
        onDrag(evt) {
            this.dragAndDrop.onVisualDrag(evt);
        },
        endDrag(evt) {
            this.draggedFromBucketName = null;
            this.dragAndDrop.endVisualDrag(evt);
        },
        onDrop(evt, toStatus, toBucketName) {
            const cardId = parseInt(evt.dataTransfer.getData('cardId'));
            const fromBucketName = evt.dataTransfer.getData('bucketName');
            
            if (cardId) {
                const fromBucket = this.campaignStore.buckets.getBucket(fromBucketName);
                if (fromBucket) {
                    const card = fromBucket.clusters.findItemById(cardId);
                    if (card) {
                        const campaignId = Number(toBucketName);
                        this.campaignStore.moveCard(card, toStatus, campaignId);
                    }
                }
            }
        },
        laneStyle(lane) {
            const key = lane.name || lane.key;
            if (this.themeStore.isDark) {
                const darkColors = {
                    'TO_DO': '#767676',       // Neutral / Gray
                    'IN_PROGRESS': 'var(--app-blue)', // Blue
                    'AWAITING': '#f2711c',    // Orange/Amber
                    'DONE': '#21ba45'         // Green
                };
                const color = darkColors[key] || '#767676';
                return {
                    borderTop: `4px solid ${color}`,
                    backgroundColor: 'transparent'
                };
            } else {
                const lightColors = {
                    'TO_DO': '#f4f5f7',
                    'IN_PROGRESS': '#e5f1fb',
                    'AWAITING': '#fdf4e6',
                    'DONE': '#eef7ee'
                };
                const color = lightColors[key] || '#f4f5f7';
                return {
                    backgroundColor: color
                };
            }
        },
        getCampaignDurationDays(campaign) {
            if (!campaign.startDate || !campaign.endDate) return null;
            const start = new Date(`${campaign.startDate}T00:00:00`);
            const end = new Date(`${campaign.endDate}T00:00:00`);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
            const diffTime = end.getTime() - start.getTime();
            if (diffTime < 0) return 0;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
    },
    mounted() {
        console.log('Campaigns UI rendered from store state')
        this.campaignStore.loadCampaignsBoard();
    }
}
</script>

<style>
.ui.container.campaigns-container {
    margin-top: 6em; /* Fixed menu offset */
    margin-bottom: 2em;
    width: 95% !important;
}

.ui.segment.mural {
    background-color: #f9fafb;
    border-radius: 8px;
    margin-bottom: 2em;
}

.campaign-info-col {
    background-color: rgba(0,0,0,0.02);
    border-right: 1px solid rgba(34,36,38,.1);
}

.ui.segment.horizontal-lane {
    min-height: 150px;
    padding-bottom: 1em !important;
}

body.dark .ui.segment.mural {
    background-color: #1b1c1d !important;
}

.campaigns-container .horizontal-lane > .ui.cards > .card {
	width: calc(33% - 1.1em);
	min-width: 250px;
	box-shadow: 0 1px 3px 0 #d4d4d5;
	margin: 0.5em;
	border: 2px solid transparent;
}

</style>
