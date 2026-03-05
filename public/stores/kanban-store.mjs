import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Clusters, Cluster } from '../domain/clusters.ts'
import { Buckets, Bucket } from '../domain/buckets.ts'
import kanbanApi from '../services/kanban-api.mjs'


export const useKanbanStore = defineStore('kanban', () => {
    console.log('Setting up Kanban Store...')

    const currentDate = ref(new Date())

    const loading = ref(false)
    const error = ref(null)

    const buckets = ref(new Buckets())

    const lanes = [
        { name: 'TO_DO', description: 'To Do', color: '#f4f5f7' },
        { name: 'IN_PROGRESS', description: 'In Progress', color: '#e5f1fb' },
        { name: 'AWAITING', description: 'Awaiting', color: '#fdf3f0' },
        { name: 'DONE', description: 'Done', color: '#eef7ee' }
    ]

    const useDateAsGroupKey = (item) => {
        // Menor data entre os timesheets
        const ts = item.timesheets || []
        if (ts.length === 0) return 'EMPTY'
        return ts.reduce((min, t) => t.date < min ? t.date : min, ts[0].date)
    }

    for (const lane of lanes) {
        buckets.value.addBucket(
            new Bucket(
                lane.name,
                lane.description,
                lane.color,
                new Clusters(useDateAsGroupKey, 'DESC')
            ))
    }

    const reloadKanbanCards = () => {
        loading.value = true
        error.value = null

        kanbanApi.getHotKanbanCards()
            .then(items => {
                buckets.value.clear()
                for (const item of items) {
                    buckets.value.addItem(item, item.status)
                }
            })
            .catch(error => {
                error.value = error
            })
            .finally(() => {
                loading.value = false
            })
    }

    const moveCard = (card, toBucket) => {
        const fromBucket = buckets.value.getBucket(card.status)
        if (!fromBucket) {
            console.error(`Bucket ${card.status} not found`)
            return
        }

        fromBucket.clusters.removeItem(card)
        toBucket.clusters.addItem(card)

        card.status = toBucket.name
        kanbanApi.updateKanbanCardStatus(card)
    }

    const saveKanbanCard = async (fromBucket, card) => {
        // Remove from old cluster BEFORE updating data (cluster key may change)
        if (fromBucket != null) {
            fromBucket.clusters.removeItem(card)
        }

        const savedData = await kanbanApi.saveKanbanCard(card)

        // Update card with saved data (new IDs, updated timesheets, etc.)
        Object.assign(card, savedData)

        const toBucket = buckets.value.getBucket(card.status)

        if (toBucket != null && !card.archived) {
            toBucket.clusters.addItem(card)
        }
    }

    const deleteKanbanCard = (fromBucket, card) => {
        kanbanApi.deleteKanbanCard(card)
        fromBucket.clusters.removeItem(card)
    }

    return {
        currentDate,
        loading,
        error,
        buckets,
        reloadKanbanCards,
        moveCard,
        saveKanbanCard,
        deleteKanbanCard
    }
})
