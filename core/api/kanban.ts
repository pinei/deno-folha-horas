import express from "express";
const router = express.Router();

import { KanbanCardStore } from '../store/kanban_card'
import { TimesheetStore } from '../store/timesheet'

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

        // Create or update timesheet
        let timesheet = timesheetStore.parseRecord(data.timesheet)
        timesheet = timesheetStore.mergeRecord(timesheet)
        record.timesheet = timesheet

        record = store.mergeRecord(record)

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

        // Create or update timesheet
        let timesheet = timesheetStore.parseRecord(data.timesheet)
        timesheet = timesheetStore.mergeRecord(timesheet)
        record.timesheet = timesheet

        record = store.mergeRecord(record)

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

        // Timesheet is not deleted

        console.log('< ' + deleted)
        res.json(deleted)
    }
    catch (error) {
        next(error)
    }
});

export default router
