import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Clusters } from '../domain/clusters.ts'
import { Buckets, Bucket } from '../domain/buckets.ts'
import campaignApi from '../services/campaign-api.mjs'
import kanbanApi from '../services/kanban-api.mjs'


export const useCampaignStore = defineStore('campaign', () => {
    console.log('Setting up Campaign Store...')

    const loading = ref(false)
    const error = ref(null)

    const buckets = ref(new Buckets())
    
    // Original campaigns list just in case we need the raw list
    const campaigns = ref([])

    const useStatusAsGroupKey = (item) => {
        return item.status || 'UNKNOWN'
    }

    const loadCampaignsList = async () => {
        try {
            const campaignsList = await campaignApi.searchCampaigns({ archived: false })
            campaigns.value = campaignsList
        } catch (err) {
            console.error('Error loading campaigns list:', err)
            error.value = err
        }
    }

    const loadCampaignsBoard = async () => {
        loading.value = true
        error.value = null

        try {
            await loadCampaignsList()
            const campaignsList = campaigns.value
            
            const cardsList = await kanbanApi.getHotKanbanCards()
            buckets.value.clear()
            buckets.value = new Buckets()

            // 2. Initialize Buckets for each Campaign
            for (const campaign of campaignsList) {
                // Map campaign type to a color or use a default
                let color = '#ffffff'
                
                const bucket = new Bucket(
                    campaign.id.toString(), // Bucket name is Campaign ID string
                    campaign.name,          // Bucket label is Campaign Name
                    color,
                    new Clusters(useStatusAsGroupKey, 'ASC')
                )
                // Attach original campaign data to bucket for easy access in UI
                bucket.campaign = campaign
                
                buckets.value.addBucket(bucket)
            }

            // 3. Populate cards into their respective campaign buckets
            for (const card of cardsList) {
                if (card.campaignId) {
                    buckets.value.addItem(card, card.campaignId.toString())
                }
            }
        } catch (err) {
            console.error('Error reloading campaigns:', err)
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const moveCard = (card, toStatus, toCampaignId) => {
        // Find current bucket (campaign)
        const fromBucket = card.campaignId ? buckets.value.getBucket(card.campaignId.toString()) : null
        
        // Target bucket
        const toBucket = toCampaignId ? buckets.value.getBucket(toCampaignId.toString()) : null

        if (fromBucket) {
            fromBucket.clusters.removeItem(card)
        }

        // Update card data locally
        card.status = toStatus
        card.campaignId = toCampaignId

        if (toBucket) {
            toBucket.clusters.addItem(card)
        }

        // Persist change
        kanbanApi.saveKanbanCard(card)
    }

    const saveCampaign = async (campaign) => {
        const savedData = await campaignApi.saveCampaign(campaign)
        // Refresh everything to reflect changes
        await loadCampaignsBoard()
    }

    const deleteCampaign = async (campaign) => {
        await campaignApi.deleteCampaign(campaign)
        await loadCampaignsBoard()
    }

    return {
        loading,
        error,
        buckets,
        campaigns,
        loadCampaignsList,
        loadCampaignsBoard,
        moveCard,
        saveCampaign,
        deleteCampaign
    }
})
