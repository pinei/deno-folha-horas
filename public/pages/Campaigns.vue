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
        />

        <h1 class="ui header" style="display: flex; justify-content: space-between; align-items: center;">
            Campaigns
            <button class="ui primary button" @click="addCampaign">
                <i class="plus icon"></i> Nova Campanha
            </button>
        </h1>
        
        <div class="ui segment mural" v-for="bucket in campaignStore.buckets.getBuckets()" :key="bucket.name">
            <div class="ui grid">
                <!-- 4 wide for Campaign info -->
                <div class="four wide column campaign-info-col">
                    <div class="ui fluid card borderless-card" @click="editCampaign(bucket.campaign)" style="cursor: pointer; box-shadow: none; border: none; background: transparent;">
                        <div class="content" style="padding-left: 0; padding-top: 0;">
                            <div class="header" style="font-size: 1.5em; margin-bottom: 0.5em;">{{ bucket.campaign.name }}</div>
                            <div class="meta" style="margin-bottom: 1em;">
                                <span class="ui small blue label">{{ bucket.campaign.type }}</span>
                            </div>
                            <div class="description" style="white-space: pre-wrap;">
                                {{ bucket.campaign.description }}
                            </div>
                        </div>
                        <div class="extra content" v-if="bucket.campaign.startDate || bucket.campaign.endDate" style="padding-left: 0; border-top: none;">
                            <i class="calendar icon"></i>
                            <span v-if="bucket.campaign.startDate">{{ bucket.campaign.startDate }}</span>
                            <span v-if="bucket.campaign.startDate && bucket.campaign.endDate"> a </span>
                            <span v-if="bucket.campaign.endDate">{{ bucket.campaign.endDate }}</span>
                        </div>
                    </div>
                </div>

                <!-- 12 wide for Kanban Cards -->
                <div class="twelve wide column kanban-lanes-col">
                    <div class="ui grid">
                        <!-- Horizontal Lane: TO_DO -->
                        <div class="sixteen wide column status-lane" 
                             @drop="onDrop($event, 'TO_DO', bucket.name)" 
                             @dragover.prevent 
                             @dragenter.prevent>
                            <h5 class="ui dividing header" style="color: #666; margin-top: 0;">To Do</h5>

                            <div class="ui cards">
                                <KanbanCard
                                    v-for="card in getCardsByStatus(bucket, 'TO_DO')" :key="card.id"
                                    :card="card"
                                    draggable="true"
                                    @dragstart="startDrag($event, card.id, bucket.name)"
                                    @dragend="endDrag($event)"
                                    @click="editCard(card)"
                                />
                                <div v-if="getCardsByStatus(bucket, 'TO_DO').length === 0" class="empty-lane-placeholder"></div>
                            </div>
                        </div>

                        <!-- Horizontal Lane: IN_PROGRESS -->
                        <div class="sixteen wide column status-lane" 
                             @drop="onDrop($event, 'IN_PROGRESS', bucket.name)" 
                             @dragover.prevent 
                             @dragenter.prevent>
                            <h5 class="ui dividing header" style="color: #666;">In Progress</h5>
                            <div class="ui cards">
                                <KanbanCard
                                    v-for="card in getCardsByStatus(bucket, 'IN_PROGRESS')" :key="card.id"
                                    :card="card"
                                    draggable="true"
                                    @dragstart="startDrag($event, card.id, bucket.name)"
                                    @dragend="endDrag($event)"
                                    @click="editCard(card)"
                                />
                                <div v-if="getCardsByStatus(bucket, 'IN_PROGRESS').length === 0" class="empty-lane-placeholder"></div>
                            </div>
                        </div>
                        
                        <!-- Horizontal Lane: AWAITING -->
                        <div class="sixteen wide column status-lane" 
                             @drop="onDrop($event, 'AWAITING', bucket.name)" 
                             @dragover.prevent 
                             @dragenter.prevent>
                            <h5 class="ui dividing header" style="color: #666;">Awaiting</h5>
                            <div class="ui cards">
                                <KanbanCard
                                    v-for="card in getCardsByStatus(bucket, 'AWAITING')" :key="card.id"
                                    :card="card"
                                    draggable="true"
                                    @dragstart="startDrag($event, card.id, bucket.name)"
                                    @dragend="endDrag($event)"
                                    @click="editCard(card)"
                                />
                                <div v-if="getCardsByStatus(bucket, 'AWAITING').length === 0" class="empty-lane-placeholder"></div>
                            </div>
                        </div>

                        <!-- Horizontal Lane: DONE -->
                        <div class="sixteen wide column status-lane" 
                             @drop="onDrop($event, 'DONE', bucket.name)" 
                             @dragover.prevent 
                             @dragenter.prevent>
                            <h5 class="ui dividing header" style="color: #666;">Done</h5>
                            <div class="ui cards">
                                <KanbanCard
                                    v-for="card in getCardsByStatus(bucket, 'DONE')" :key="card.id"
                                    :card="card"
                                    draggable="true"
                                    @dragstart="startDrag($event, card.id, bucket.name)"
                                    @dragend="endDrag($event)"
                                    @click="editCard(card)"
                                />
                                <div v-if="getCardsByStatus(bucket, 'DONE').length === 0" class="empty-lane-placeholder"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useCampaignStore } from '../stores/campaign-store.mjs'
import EditCampaign from '../components/EditCampaign.vue'
import EditKanbanCard from '../components/EditKanbanCard.vue'
import KanbanCard from '../components/KanbanCard.vue'

export default {
    name: 'Campaigns',
    components: {
        EditCampaign,
        EditKanbanCard,
        KanbanCard
    },
    data() {
        return {
            campaignStore: useCampaignStore(),
            isCampaignModalVisible: false,
            selectedCampaign: {},
            isCardModalVisible: false,
            selectedCard: {},
            draggedCardId: null,
            draggedFromCampaignId: null
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

        getCardsByStatus(bucket, status) {
            const cluster = bucket.clusters.findCluster(status);
            return cluster ? cluster.items : [];
        },

        startDrag(evt, cardId, campaignId) {
            evt.dataTransfer.dropEffect = 'move';
            evt.dataTransfer.effectAllowed = 'move';
            evt.dataTransfer.setData('cardId', cardId);
            evt.dataTransfer.setData('campaignId', campaignId);
            this.draggedCardId = cardId;
            this.draggedFromCampaignId = campaignId;
        },
        endDrag(evt) {
            this.draggedCardId = null;
            this.draggedFromCampaignId = null;
        },
        onDrop(evt, toStatus, toCampaignId) {
            const cardId = parseInt(evt.dataTransfer.getData('cardId'));
            const fromCampaignId = evt.dataTransfer.getData('campaignId');
            
            if (cardId) {
                const fromBucket = this.campaignStore.buckets.getBucket(fromCampaignId);
                if (fromBucket) {
                    const card = fromBucket.clusters.findItemById(cardId);
                    if (card) {
                        this.campaignStore.moveCard(card, toStatus, Number(toCampaignId));
                    }
                }
            }
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
    border-top: 4px solid #2185d0;
}

.campaign-info-col {
    background-color: rgba(0,0,0,0.02);
    border-right: 1px solid rgba(34,36,38,.1);
}

.status-lane {
    padding-bottom: 1em !important;
}

.empty-lane-placeholder {
    height: 60px;
    width: 100%;
    border: 1px dashed rgba(0,0,0,0.1);
    border-radius: 4px;
    margin-top: 0.5em;
}

.ui.cards > .card {
	width: calc(33% - 1.1em);
	min-width: 250px;
	box-shadow: 0 1px 3px 0 #d4d4d5;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	cursor: pointer;
	margin: 0.5em;
	border: 2px solid transparent;
}

.ui.cards>.card.small-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px 0 rgba(34, 36, 38, .12), 0 2px 4px 0 rgba(34, 36, 38, .08);
}
</style>
