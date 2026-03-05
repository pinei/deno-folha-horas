import express from "express";
const router = express.Router();

import { KanbanCardStore } from '../store/kanban_card'
import { TimesheetStore, TimesheetRecord } from '../store/timesheet'

const store = new KanbanCardStore()
const timesheetStore = new TimesheetStore()

router.post('/search', (req, res, next) => {
    try {
        const filter = req.body
        console.log('> POST /kanban/search: ' + JSON.stringify(filter))

        const records = store.listRecords(filter)
        console.log('< ' + JSON.stringify(records))
        res.json(records)
    }
    catch (error) {
        next(error)
    }
})

router.post('/', (req, res, next) => {
    try {
        const data = req.body
        console.log('> POST /kanban: ' + JSON.stringify(data))

        let record = store.parseRecord(data)
        record = store.mergeRecord(record)

        // Save associated timesheets
        if (data.timesheets && Array.isArray(data.timesheets)) {
            record.timesheets = data.timesheets.map((tsData: any) => {
                let ts = new TimesheetRecord(tsData)
                ts.kanbanCardId = record.id
                ts = timesheetStore.mergeRecord(ts)
                return ts
            })

            // Unlink timesheets removed from the card
            const keepIds = record.timesheets.map(ts => ts.id).filter(id => id > 0)
            store.unlinkRemovedTimesheets(record.id, keepIds)
        }

        console.log('< ' + JSON.stringify(record))
        res.json(record)
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

        let record = store.parseRecord(data)
        record = store.mergeRecord(record)

        // Save associated timesheets
        if (data.timesheets && Array.isArray(data.timesheets)) {
            record.timesheets = data.timesheets.map((tsData: any) => {
                let ts = new TimesheetRecord(tsData)
                ts.kanbanCardId = record.id
                ts = timesheetStore.mergeRecord(ts)
                return ts
            })

            // Unlink timesheets removed from the card
            const keepIds = record.timesheets.map(ts => ts.id).filter(id => id > 0)
            store.unlinkRemovedTimesheets(record.id, keepIds)
        }

        console.log('< ' + JSON.stringify(record))
        res.json(record)
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

        const deleted = store.deleteRecord(Number(id))

        // Timesheets are not deleted, their KANBAN_CARD_ID is set to NULL via FK constraint

        console.log('< ' + deleted)
        res.json(deleted)
    }
    catch (error) {
        next(error)
    }
});

export default router
