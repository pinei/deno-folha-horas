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
        // Actions for manipulating cards can be added here
    }
})
