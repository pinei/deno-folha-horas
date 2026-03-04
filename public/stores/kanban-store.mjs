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

    for (const lane of lanes) {
        buckets.value.add(
            new Bucket(
                lane.name,
                lane.description,
                lane.color,
                new Clusters((item) => item.timesheet.date, 'DESC')
            ))
    }

    const loadKanbanCards = () => {
        loading.value = true
        error.value = null

        kanbanApi.getHotKanbanCards()
            .then(items => {
                for (const item of items) {
                    const bucket = buckets.value.getBucket(item.status)

                    if (!bucket) {
                        console.error(`Bucket ${item.status} not found`)
                        continue
                    }

                    bucket.addCluster(new Cluster(item))
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

        fromBucket.clusters.remove(card)
        toBucket.clusters.add(card)

        card.status = toBucket.name
        kanbanApi.updateCardStatus(card)
    }

    const saveKanbanCard = (fromBucket, card) => {
        kanbanApi.saveKanbanCard(card)

        if (fromBucket != null) {
            if (fromBucket.name !== card.status) {
                fromBucket.clusters.remove(card)
            }
            else {
                return
            }
        }

        buckets.value.getBucket(card.status).clusters.add(card)
    }

    const deleteKanbanCard = (fromBucket, card) => {
        kanbanApi.deleteKanbanCard(card)
        fromBucket.clusters.remove(card)
    }

    return {
        currentDate,
        loading,
        error,
        buckets,
        loadKanbanCards,
        moveCard,
        saveKanbanCard,
        deleteKanbanCard
    }
})
