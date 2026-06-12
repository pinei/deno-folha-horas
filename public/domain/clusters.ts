/*
 * ClusterNode is a node in the grouping tree.
 * For leaf level, items contains the grouped elements.
 * For intermediate levels, children contains the sub-clusters.
 */
export class ClusterNode {
    key: string = ''
    children: ClusterNode[] = []
    items: any[] = []
}

/*
 * Clusters is an ordered list of clusters, where the order is determined by the cluster key.
 * It supports both single-level flat groupings (backwards compatible) and multi-level nested groupings.
 */
export class Clusters {
    nodes: ClusterNode[] = []
    keyFunctions: Array<(record: any) => string>
    orderings: Array<'ASC' | 'DESC'>

    constructor(
        keyFunctionOrArray: ((record: any) => string) | Array<(record: any) => string>,
        orderingOrArray: 'ASC' | 'DESC' | Array<'ASC' | 'DESC'> = 'DESC'
    ) {
        if (Array.isArray(keyFunctionOrArray)) {
            this.keyFunctions = keyFunctionOrArray
        } else {
            this.keyFunctions = [keyFunctionOrArray]
        }

        if (Array.isArray(orderingOrArray)) {
            this.orderings = orderingOrArray
        } else {
            this.orderings = [orderingOrArray]
        }
    }

    clear() {
        this.nodes.splice(0, this.nodes.length)
    }

    findCluster(key: string): ClusterNode | undefined {
        return this.nodes.find((node) => node.key === key)
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

    getItems(): any[] {
        return this._collectItems(this.nodes, 0)
    }

    _collectItems(nodes: ClusterNode[], levelIndex: number): any[] {
        if (levelIndex === this.keyFunctions.length - 1) {
            return nodes.flatMap(n => n.items)
        }
        return nodes.flatMap(n => this._collectItems(n.children, levelIndex + 1))
    }

    getClusters() {
        return this.nodes
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
