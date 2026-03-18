import express from "express";
const router = express.Router();

import { TimesheetStore, TimesheetRecord } from '../store/timesheet'
import assert from "node:assert";

const store = new TimesheetStore()

router.post('/search', (req, res, next) => {
    try {
        const filter = req.body
        console.log('> POST /timesheet/search: ' + JSON.stringify(filter))

        if (filter.startDate) {
            filter.startDate = new Date(filter.startDate)
        }
        if (filter.endDate) {
            filter.endDate = new Date(filter.endDate)
        }

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
        console.log('> POST /timesheet: ' + JSON.stringify(data))

        let record = store.parseRecord(data)
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
        console.log(`> POST /timesheet/${id}: ` + JSON.stringify(data))

        if (data.id != id) {
            throw ('ID mismatch')
        }

        let record = store.parseRecord(data)
        record = store.mergeRecord(record)

        console.log('< ' + JSON.stringify(record))
        res.json(record)
    }
    catch (error) {
        next(error)
    }
});

router.delete('/:id', (req, res, next) => {
    try {
        const id = Number(req.params.id)
        console.log('> DELETE /timesheet/' + id)

        const deleted = store.deleteRecord(id)

        console.log('< ' + deleted)
        res.json(deleted)
    }
    catch (error) {
        next(error)
    }
});

router.put('/:id/kanban-card', (req, res, next) => {
    try {
        const id = Number(req.params.id)
        const { kanbanCardId } = req.body
        console.log(`> PUT /timesheet/${id}/kanban-card: kanbanCardId=${kanbanCardId}`)

        const record = store.linkKanbanCard(id, kanbanCardId)

        console.log('< ' + JSON.stringify(record))
        res.json(record)
    }
    catch (error) {
        next(error)
    }
});

export default router