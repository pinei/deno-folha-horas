import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

async function getHotKanbanCards() {
    console.log(`Fetching kanban cards`)

    const response = await api.get('/kanban/search', {
        params: {
            archive: false
        }
    })
    console.log('Response: ', response.data)

    return response.data
}

async function saveKanbanCard(card) {
    console.log('Saving kanban card: ', card)

    const response = await (
        card.id
            ? api.post(`/kanban/${card.id}`, card)
            : api.post('/kanban', card)
    )

    console.log('Response: ', response.data)
    return response.data
}

async function archiveKanbanCard(card) {
    console.log('Archiving kanban card: ', card)
    const response = await api.put(`/kanban/${card.id}`, {
        archived: true
    })

    console.log('Response: ', response.data)
    return response.data
}

async function updateKanbanCardStatus(card) {
    console.log('Updating kanban card status: ', card)
    const response = await api.put(`/kanban/${card.id}`, {
        status: card.status
    })

    console.log('Response: ', response.data)
    return response.data
}

async function deleteKanbanCard(card) {
    console.log('Deleting kanban card: ', card)
    const response = await api.delete(`/kanban/${card.id}`)

    console.log('Response: ', response.data)
    return response.data
}


export default {
    getKanbanCards,
    saveKanbanCard,
    deleteKanbanCard
}
