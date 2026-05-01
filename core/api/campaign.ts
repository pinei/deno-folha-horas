import express from "express";
const router = express.Router();

import { CampaignStore } from '../store/campaign'

const store = new CampaignStore()

router.post('/search', (req, res, next) => {
    try {
        const filter = req.body
        console.log('> POST /campaign/search: ' + JSON.stringify(filter))

        const records = store.listCampaigns(filter)
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
        console.log('> POST /campaign: ' + JSON.stringify(data))

        let record = store.parseCampaign(data)
        record = store.mergeCampaign(record)

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
        console.log(`> POST /campaign/${id}: ` + JSON.stringify(data))

        if (data.id != id) {
            throw ('ID mismatch')
        }

        let record = store.parseCampaign(data)
        record = store.mergeCampaign(record)

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
        console.log('> DELETE /campaign/' + id)

        const deleted = store.deleteCampaign(id)

        console.log('< ' + deleted)
        res.json(deleted)
    }
    catch (error) {
        next(error)
    }
});

export default router
