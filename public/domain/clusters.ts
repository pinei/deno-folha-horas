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

    clear() {
        this.clusters = []
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
        let cluster = this.findCluster(key)
        let index = -1

        // Try finding by key first
        if (cluster) {
            index = cluster.items.findIndex((i: any) => i.id === item.id)
        }

        // Fallback: search all clusters by id (key may have changed after editing)
        if (index === -1) {
            for (const c of this.clusters) {
                index = c.items.findIndex((i: any) => i.id === item.id)
                if (index !== -1) {
                    cluster = c
                    break
                }
            }
        }

        if (cluster && index !== -1) {
            cluster.items.splice(index, 1)

            if (cluster.items.length === 0) {
                const clusterIndex = this.clusters.findIndex((c) => c.key === cluster.key)
                this.clusters.splice(clusterIndex, 1)
            }
        }

        this.sortByKey()
    }
}

export class ClusterNode {
    key: string = ''
    children: ClusterNode[] = []
    items: any[] = []
}

export class NestedClusters {
    nodes: ClusterNode[] = []
    keyFunctions: Array<(record: any) => string>
    orderings: Array<'ASC' | 'DESC'>

    constructor(
        keyFunctions: Array<(record: any) => string>,
        orderings: Array<'ASC' | 'DESC'> = ['DESC']
    ) {
        this.keyFunctions = keyFunctions
        this.orderings = orderings
    }

    clear() {
        this.nodes.splice(0, this.nodes.length)
    }

    getClusters() {
        return this.nodes
    }

    setItems(items: any[]) {
        const newNodes = this._buildLevel(items, 0)
        this.nodes.splice(0, this.nodes.length, ...newNodes)
    }

    _buildLevel(items: any[], levelIndex: number): ClusterNode[] {
        if (levelIndex >= this.keyFunctions.length) return []

        const keyFunc = this.keyFunctions[levelIndex]
        const ordering = this.orderings[levelIndex] || this.orderings[0] || 'DESC'
        const map = new Map<string, any[]>()

        for (const item of items) {
            const key = keyFunc(item)
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(item)
        }

        const nodes: ClusterNode[] = []
        for (const [key, levelItems] of map) {
            const node = new ClusterNode()
            node.key = key

            if (levelIndex === this.keyFunctions.length - 1) {
                node.items = levelItems
            } else {
                node.children = this._buildLevel(levelItems, levelIndex + 1)
            }
            nodes.push(node)
        }

        nodes.sort((a, b) => {
            return ordering === 'ASC' ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)
        })

        return nodes
    }

    findItemById(id: number | string): any | null {
        return this._findItemInNodes(this.nodes, id, 0)
    }

    _findItemInNodes(nodes: ClusterNode[], id: number | string, levelIndex: number): any | null {
        for (const node of nodes) {
            if (levelIndex === this.keyFunctions.length - 1) {
                const item = node.items.find((item: any) => item.id === id)
                if (item) return item
            } else {
                const item = this._findItemInNodes(node.children, id, levelIndex + 1)
                if (item) return item
            }
        }
        return null
    }

    getItems(): any[] {
        return this._collectItems(this.nodes, 0)
    }

    _collectItems(nodes: ClusterNode[], levelIndex: number): any[] {
        if (levelIndex === this.keyFunctions.length - 1) {
            return nodes.flatMap(n => n.items)
        }
        return nodes.flatMap(n => this._collectItems(n.children, levelIndex + 1))
    }

    addItem(item: any) {
        this._addItemToLevel(this.nodes, item, 0)
    }

    _addItemToLevel(nodes: ClusterNode[], item: any, levelIndex: number) {
        const keyFunc = this.keyFunctions[levelIndex]
        const key = keyFunc(item)
        const ordering = this.orderings[levelIndex] || this.orderings[0] || 'DESC'

        let node = nodes.find(n => n.key === key)
        if (!node) {
            node = new ClusterNode()
            node.key = key
            nodes.push(node)
            nodes.sort((a, b) => ordering === 'ASC' ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key))
        }

        if (levelIndex === this.keyFunctions.length - 1) {
            node.items.push(item)
        } else {
            this._addItemToLevel(node.children, item, levelIndex + 1)
        }
    }

    removeItem(item: any) {
        this._removeItemFromLevel(this.nodes, item, 0)
    }

    _removeItemFromLevel(nodes: ClusterNode[], item: any, levelIndex: number): boolean {
        const keyFunc = this.keyFunctions[levelIndex]
        const key = keyFunc(item)
        
        let nodeIndex = nodes.findIndex(n => n.key === key)
        
        if (nodeIndex === -1) {
            for (let i = 0; i < nodes.length; i++) {
                const childNode = nodes[i]
                if (levelIndex === this.keyFunctions.length - 1) {
                    const itemIdx = childNode.items.findIndex((it: any) => it.id === item.id)
                    if (itemIdx !== -1) {
                        childNode.items.splice(itemIdx, 1)
                        if (childNode.items.length === 0) {
                            nodes.splice(i, 1)
                        }
                        return true
                    }
                } else {
                    const removed = this._removeItemFromLevel(childNode.children, item, levelIndex + 1)
                    if (removed) {
                        if (childNode.children.length === 0) {
                            nodes.splice(i, 1)
                        }
                        return true
                    }
                }
            }
            return false
        }

        const node = nodes[nodeIndex]
        if (levelIndex === this.keyFunctions.length - 1) {
            const itemIdx = node.items.findIndex((it: any) => it.id === item.id)
            if (itemIdx !== -1) {
                node.items.splice(itemIdx, 1)
                if (node.items.length === 0) {
                    nodes.splice(nodeIndex, 1)
                }
                return true
            }
        } else {
            const removed = this._removeItemFromLevel(node.children, item, levelIndex + 1)
            if (removed) {
                if (node.children.length === 0) {
                    nodes.splice(nodeIndex, 1)
                }
                return true
            }
        }
        return false
    }
}

