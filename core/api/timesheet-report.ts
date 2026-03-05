import express from "express";
const router = express.Router();

import { TimesheetReport } from '../store/timesheet-report'
import assert from "node:assert";

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

router.get('/facts-and-deliveries', (req, res, next) => {
    try {
        const startMonthStr = req.query.startMonthStr as string
        const endMonthStr = req.query.endMonthStr as string
        console.log(`> GET /facts-and-deliveries?startMonthStr=${startMonthStr}&endMonthStr=${endMonthStr}`)

        const data = report.factsAndDeliveriesReport(startMonthStr, endMonthStr)
        res.json(data)
    }
    catch (error) {
        next(error)
    }
});

export default router