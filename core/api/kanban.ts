import express from "express";
const router = express.Router();

import { KanbanCardStore } from '../store/kanban_card'
import { TimesheetStore, TimesheetRecord } from '../store/timesheet'

const store = new KanbanCardStore()
const timesheetStore = new TimesheetStore()

router.get('/available', (req, res, next) => {
    try {
        console.log('> GET /kanban/available')
        const cards = store.listAvailableCards()
        console.log('< ' + JSON.stringify(cards))
        res.json(cards)
    }
    catch (error) {
        next(error)
    }
})

router.post('/search', (req, res, next) => {
    try {
        const filter = req.body
        console.log('> POST /kanban/search: ' + JSON.stringify(filter))

        const cards = store.listCards(filter)
        console.log('< ' + JSON.stringify(cards))
        res.json(cards)
    }
    catch (error) {
        next(error)
    }
})

router.post('/', (req, res, next) => {
    try {
        const data = req.body
        console.log('> POST /kanban: ' + JSON.stringify(data))

        let card = store.parseCard(data)
        card = store.mergeCard(card)

        // Save associated timesheets
        if (data.timesheets && Array.isArray(data.timesheets)) {
            card.timesheets = data.timesheets.map((tsData: any) => {
                let ts = new TimesheetRecord(tsData)
                ts.kanbanCard = { id: card.id }
                ts = timesheetStore.mergeRecord(ts)
                return ts
            })

            // Unlink timesheets removed from the card
            const keepIds = card.timesheets.map(ts => ts.id).filter(id => id > 0)
            store.unlinkRemovedTimesheets(card.id, keepIds)
        }

        console.log('< ' + JSON.stringify(card))
        res.json(card)
    }
    catch (error) {
        next(error)
    }
});

router.post('/:id', (req, res, next) => {
    try {
        const data = req.body
        const id = req.params.id
        console.log(`> POST /kanban/${id}: ` + JSON.stringify(data))

        if (data.id != id) {
            throw ('ID mismatch')
        }

        let card = store.parseCard(data)
        card = store.mergeCard(card)

        // Save associated timesheets
        if (data.timesheets && Array.isArray(data.timesheets)) {
            card.timesheets = data.timesheets.map((tsData: any) => {
                let ts = new TimesheetRecord(tsData)
                ts.kanbanCard = { id: card.id }
                ts = timesheetStore.mergeRecord(ts)
                return ts
            })

            // Unlink timesheets removed from the card
            const keepIds = card.timesheets.map(ts => ts.id).filter(id => id > 0)
            store.unlinkRemovedTimesheets(card.id, keepIds)
        }

        console.log('< ' + JSON.stringify(card))
        res.json(card)
    }
    catch (error) {
        next(error)
    }
});

router.put('/:id', (req, res, next) => {
    try {
        const data = req.body
        const id = req.params.id
        console.log(`> PUT /kanban/${id}: ` + JSON.stringify(data))

        if (data.archived !== undefined) {
            store.updateArchiveStatus(Number(id), data.archived)
        }

        if (data.status !== undefined) {
            store.updateStatus(Number(id), data.status)
        }

        console.log('< PUT OK')
        res.json({ success: true })
    }
    catch (error) {
        next(error)
    }
});

router.delete('/:id', (req, res, next) => {
    try {
        const id = req.params.id
        console.log('> DELETE /kanban/' + id)

        const deleted = store.deleteCard(Number(id))

        // Timesheets are not deleted, their KANBAN_CARD_ID is set to NULL via FK constraint

        console.log('< ' + deleted)
        res.json(deleted)
    }
    catch (error) {
        next(error)
    }
});

export default router
