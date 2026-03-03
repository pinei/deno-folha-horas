import { defineStore } from 'pinia'

export const useKanbanStore = defineStore('kanban', {
    state: () => ({
        lanes: [
            {
                id: 'todo',
                title: 'To Do',
                color: '#f4f5f7',
                dateGroups: [
                    {
                        date: '2026-03-02',
                        label: 'Segunda',
                        cards: [
                            {
                                id: 1,
                                title: 'Design Database Schema',
                                meta: 'Backend',
                                description: 'Create the initial ER diagram for the new module.',
                                categories: [{ label: 'JURIDICO', color: 'orange' }],
                                hours: '1'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'awaiting',
                title: 'Awaiting',
                color: '#fdf3f0',
                dateGroups: [
                    {
                        date: '2026-03-03',
                        label: 'Terça',
                        cards: [
                            {
                                id: 2,
                                title: 'Update Documentation',
                                meta: 'Docs',
                                description: 'Write the API documentation for the authorization endpoints.',
                                categories: [{ label: 'RS', color: 'teal' }],
                                hours: '0.5'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'in-progress',
                title: 'In Progress',
                color: '#e5f1fb',
                dateGroups: [
                    {
                        date: '2026-03-04',
                        label: 'Quarta',
                        cards: [
                            {
                                id: 3,
                                title: 'Migrate to Node.js',
                                meta: 'Infrastructure',
                                description: 'Convert Deno timesheet app to standard Node.js format.',
                                categories: [{ label: 'SEGEPE', color: 'purple' }],
                                hours: '3'
                            }
                        ]
                    },
                    {
                        date: '2026-03-05',
                        label: 'Quinta',
                        cards: [
                            {
                                id: 4,
                                title: 'Build Kanban UI',
                                meta: 'Frontend',
                                description: 'Create a static 3-lane board for the new Vue component.',
                                categories: [{ label: 'GOVERNANCA', color: 'pink' }],
                                hours: '2'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'done',
                title: 'Done',
                color: '#eef7ee',
                dateGroups: [
                    {
                        date: '2026-03-06',
                        label: 'Sexta',
                        cards: [
                            {
                                id: 5,
                                title: 'Setup Repository',
                                meta: 'Admin',
                                description: 'Initialize Git repo and configure basic CI/CD.',
                                categories: [{ label: 'JURIDICO', color: 'orange' }],
                                hours: '1'
                            },
                            {
                                id: 6,
                                title: 'Create Package.json',
                                meta: 'Config',
                                description: 'Define project dependencies and start scripts.',
                                categories: [{ label: 'SEGEPE', color: 'purple' }],
                                hours: '0.5'
                            }
                        ]
                    }
                ]
            }
        ]
    }),
    actions: {
        moveCard(cardId, toLaneId) {
            let foundCard = null;
            let fromGroup = null;
            let fromLane = null;

            // Find and remove the card
            for (const lane of this.lanes) {
                for (const group of lane.dateGroups) {
                    const cardIndex = group.cards.findIndex(c => c.id === cardId);
                    if (cardIndex !== -1) {
                        foundCard = group.cards.splice(cardIndex, 1)[0];
                        fromGroup = group;
                        fromLane = lane;
                        break;
                    }
                }
                if (foundCard) break;
            }

            if (!foundCard) return;

            // If same lane, put it back
            if (fromLane.id === toLaneId) {
                fromGroup.cards.push(foundCard);
                return;
            }

            // Find destination lane
            const toLane = this.lanes.find(l => l.id === toLaneId);
            if (!toLane) {
                // If lane not found, put it back
                fromGroup.cards.push(foundCard);
                return;
            }

            // Find or create dateGroup in destination lane
            let targetGroup = toLane.dateGroups.find(g => g.date === fromGroup.date);
            if (!targetGroup) {
                targetGroup = {
                    date: fromGroup.date,
                    label: fromGroup.label,
                    cards: []
                };
                // Keep dateGroups sorted or just push
                toLane.dateGroups.push(targetGroup);
                toLane.dateGroups.sort((a, b) => a.date.localeCompare(b.date));
            }

            // Add the card to target group
            targetGroup.cards.push(foundCard);

            // Cleanup empty groups in source lane
            fromLane.dateGroups = fromLane.dateGroups.filter(g => g.cards.length > 0);
        }
    }
})
