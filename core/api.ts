import express from "npm:express";

import sapCodesRouter from './api/sap-codes.ts'
import timesheetRouter from './api/timesheet.ts'
import timesheetReportRouter from './api/timesheet-report.ts'

const router = express.Router();

router.use(express.json())
router.use('/sap-codes', sapCodesRouter)
router.use('/timesheet', timesheetRouter)
router.use('/timesheet/report', timesheetReportRouter)

export default router