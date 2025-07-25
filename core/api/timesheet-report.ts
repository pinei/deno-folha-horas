import express from "npm:express";
const router = express.Router();

import { TimesheetReport } from '../store/timesheet-report.ts'
import { assert } from "https://deno.land/std@0.176.0/_util/asserts.ts";

const report = new TimesheetReport()

router.get('/month-timesheet/:year/:month', (req, res, next) => {
    try {
        const year = req.params.year
        const month = req.params.month

        assert(year.match(/^\d{4}$/), 'Invalid year')
        assert(month.match(/^\d{2}$/), 'Invalid month')
        
        console.log(`> GET /month-timesheet/${year}/${month}`)

        const data = report.monthTimeReport(year, month)
        res.json(data)
    }
    catch (error) {
        next(error)
    }
});

router.get('/facts-and-deliveries', (_, res, next) => {
    try {
        console.log('> GET /facts-and-deliveries')

        const data = report.factsAndDeliveriesReport()
        res.json(data)
    }
    catch (error) {
        next(error)
    }
});

export default router