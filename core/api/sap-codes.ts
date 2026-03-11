import express from "express";
const router = express.Router();

import { SAPCodeStore, SAPCode } from '../store/sap-codes'
import assert from "node:assert";

const store = new SAPCodeStore()

router.get('/', (_, res, next) => {
    try {
        const sapCodes = store.listObjects()
        console.log('< ' + JSON.stringify(sapCodes))
        res.json(sapCodes)
    }
    catch (error) {
        next(error)
    }
});

router.get('/categories', (_, res, next) => {
    try {
        const categories = store.listCategories()
        console.log('< ' + JSON.stringify(categories))
        res.json(categories)
    }
    catch (error) {
        next(error)
    }
});

router.post('/:id', (req, res, next) => {
    try {
        const data = req.body
        const id = req.params.id
        console.log(`> POST /sap-codes/${id}: ` + JSON.stringify(data))

        let sapCode = new SAPCode(data).validated()
        if (data.id != id) {
            throw ('ID mismatch')
        }
        sapCode = store.mergeObject(sapCode)

        console.log('< ' + JSON.stringify(sapCode))
        res.send(sapCode)
    }
    catch (error) {
        next(error)
    }
});

router.post('/', (req, res, next) => {
    try {
        const data = req.body
        console.log('> POST /sap-codes: ' + JSON.stringify(data))

        delete (data.id)

        let sapCode = new SAPCode(data).validated()
        sapCode = store.mergeObject(sapCode)

        console.log('< ' + JSON.stringify(sapCode))
        res.send(sapCode)
    }
    catch (error) {
        next(error)
    }
});

router.delete('/:id', (req, res, next) => {
    try {
        const id = Number(req.params.id)
        console.log(`> DELETE /sap-codes/${id}`)

        const result = store.deleteObject(id)

        console.log('< ' + JSON.stringify(result))
        res.send(result)
    }
    catch (error) {
        next(error)
    }
});

export default router