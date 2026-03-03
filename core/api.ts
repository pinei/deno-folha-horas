import express from "express";

import sapCodesRouter from './api/sap-codes'
import timesheetRouter from './api/timesheet'
import timesheetReportRouter from './api/timesheet-report'
import kanbanRouter from './api/kanban'

const router = express.Router();

router.use(express.json())
router.use('/sap-codes', sapCodesRouter)
router.use('/timesheet', timesheetRouter)
router.use('/timesheet/report', timesheetReportRouter)
router.use('/kanban', kanbanRouter)

export default router