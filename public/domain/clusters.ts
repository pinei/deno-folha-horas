/*
 * Cluster is a group of items with the same key.
 */
export class Cluster {
    key: string
    items: any[] = []
}

/*
 * Clusters is an ordered list of clusters, where the order is determined by the cluster key.
 * The order can be ascending (ex: names) or descending (ex: dates).
 */
export class Clusters {
    clusters: Cluster[] = []

    // Function to get the key of the group
    keyFunction: (record: any) => string

    // Ordering of the keys
    ordering: 'ASC' | 'DESC'

    constructor(
        keyFunction: (record: any) => string,
        ordering: 'ASC' | 'DESC' = 'DESC'
    ) {
        this.keyFunction = keyFunction
        this.ordering = ordering
    }

    findCluster(key: string) {
        return this.clusters.find((cluster) => cluster.key === key)
    }

    findItemById(id: number | string) {
        for (const cluster of this.clusters) {
            const item = cluster.items.find((item: any) => item.id === id)
            if (item) {
                return item
            }
        }
        return null
    }

    sortByKey() {
        this.clusters.sort((a, b) => {
            if (this.ordering === 'ASC') {
                return a.key.localeCompare(b.key)
            } else {
                return b.key.localeCompare(a.key)
            }
        })
    }

    setItems(items: any[]) {
        this.clusters.splice(0, this.clusters.length)

        let mapClusterByKey = new Map()

        for (const item of items) {
            const key = this.keyFunction(item)

            if (!mapClusterByKey.has(key)) {
                mapClusterByKey.set(key, [])
            }

            mapClusterByKey.get(key).push(item)
        }

        for (const [key, items] of mapClusterByKey) {
            this.clusters.push({
                key: key,
                items: items,
            })
        }

        this.sortByKey()
    }

    getItems() {
        return this.clusters.flatMap((cluster) => cluster.items)
    }

    getClusters() {
        return this.clusters
    }

    addItem(item: any) {
        const key = this.keyFunction(item)

        if (!this.findCluster(key)) {
            this.clusters.push({
                key: key,
                items: [item],
            })
        }
        else {
            this.findCluster(key).items.push(item)
        }

        this.sortByKey()
    }

    removeItem(item: any) {
        const key = this.keyFunction(item)
        const cluster = this.findCluster(key)

        if (cluster) {
            const index = cluster.items.findIndex((i: any) => i.id === item.id)
            if (index !== -1) {
                cluster.items.splice(index, 1)

                if (cluster.items.length === 0) {
                    const clusterIndex = this.clusters.findIndex((c) => c.key === key)
                    this.clusters.splice(clusterIndex, 1)
                }
            }
        }

        this.sortByKey()
    }
}

