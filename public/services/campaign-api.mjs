import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

async function searchCampaigns(filter) {
    const response = await api.post('/campaign/search', filter)
    return response.data
}

async function saveCampaign(campaign) {
    console.log('Saving campaign: ', campaign)

    const response = await (
        campaign.id
            ? api.post(`/campaign/${campaign.id}`, campaign)
            : api.post('/campaign', campaign)
    )

    console.log('Response: ', response.data)
    return response.data
}

async function deleteCampaign(campaign) {
    console.log('Deleting campaign: ', campaign)
    const response = await api.delete(`/campaign/${campaign.id}`)

    console.log('Response: ', response.data)
    return response.data
}

export default {
    searchCampaigns,
    saveCampaign,
    deleteCampaign,
}
