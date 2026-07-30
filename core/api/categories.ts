import express from 'express'
import { CategoryStore, Category } from '../store/categories'

const router = express.Router()
const store = new CategoryStore()

router.get('/', (_, res, next) => {
    try {
        const categories = store.list()
        console.log('< ' + JSON.stringify(categories))
        res.json(categories)
    }
    catch (error) {
        next(error)
    }
})

const listActive = (_: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const categories = store.listActive()
        console.log('< ' + JSON.stringify(categories))
        res.json(categories)
    }
    catch (error) {
        next(error)
    }
}

router.get('/active', listActive)
router.get('/categories', listActive)

router.post('/:id', (req, res, next) => {
    try {
        const data = req.body
        const id = Number(req.params.id)
        console.log(`> POST /categories/${id}: ` + JSON.stringify(data))

        if (Number(data.id) !== id) {
            throw new Error('ID mismatch')
        }

        const category = store.merge(new Category(data).validated())
        console.log('< ' + JSON.stringify(category))
        res.json(category)
    }
    catch (error) {
        next(error)
    }
})

router.post('/', (req, res, next) => {
    try {
        const data = { ...req.body }
        console.log('> POST /categories: ' + JSON.stringify(data))
        delete data.id

        const category = store.merge(new Category(data).validated())
        console.log('< ' + JSON.stringify(category))
        res.json(category)
    }
    catch (error) {
        next(error)
    }
})

router.delete('/:id', (req, res, next) => {
    try {
        const id = Number(req.params.id)
        console.log(`> DELETE /categories/${id}`)

        const result = store.delete(id)
        console.log('< ' + JSON.stringify(result))
        res.json(result)
    }
    catch (error) {
        next(error)
    }
})

export default router