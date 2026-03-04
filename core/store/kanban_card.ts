import assert from 'node:assert'
import database from '../database';
import { TimesheetRecord } from './timesheet';

class KanbanCardRecord {
    id = 0
    issue: string | null = null
    status: string | null = null
    archived = false
    timesheet: TimesheetRecord | null = null

    constructor(data: Partial<KanbanCardRecord>) {
        Object.assign(this, data)
    }

    checkRequired(field: keyof KanbanCardRecord, errorMessage: string) {
        const value = this[field];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() == '')) {
            throw new Error(errorMessage);
        }
    }

    validated() {
        this.checkRequired('timesheet', 'Timesheet is required')
        this.checkRequired('status', 'Status is required')
        this.checkRequired('issue', 'Issue is required')

        return this
    }
}

class KanbanCardStore {
    _queryForListRecords(filter: any) {
        let { timesheetId, issue, status, archived } = filter

        let sql = `select
            KANBAN_CARD.*,
            TIMESHEET.DATE AS TIMESHEET_DATE,
            TIMESHEET.CATEGORY AS TIMESHEET_CATEGORY,
            TIMESHEET.TIME_SPENT AS TIMESHEET_TIME_SPENT,
            TIMESHEET.DESCRIPTION AS TIMESHEET_DESCRIPTION,
            TIMESHEET.RELEVANT_FACTS AS TIMESHEET_RELEVANT_FACTS,
            TIMESHEET.DELIVERIES AS TIMESHEET_DELIVERIES,
            TIMESHEET.CONTEXT AS TIMESHEET_CONTEXT
        from
            KANBAN_CARD JOIN
            TIMESHEET ON KANBAN_CARD.TIMESHEET_ID = TIMESHEET.ID
        where
            1 = 1`
        let params: any = {}

        if (timesheetId) {
            sql += ` and TIMESHEET_ID = @timesheetId`
            params['@timesheetId'] = timesheetId
        }

        if (issue) {
            sql += ` and ISSUE = @issue`
            params['@issue'] = issue
        }

        if (status) {
            sql += ` and STATUS = @status`
            params['@status'] = status
        }

        if (archived !== undefined) {
            sql += ` and ARCHIVED = @archived`
            params['@archived'] = archived ? 1 : 0
        }

        return {
            sql,
            params
        }
    }

    listRecords(filter: any): KanbanCardRecord[] {
        filter = filter || {}

        const query = this._queryForListRecords(filter)

        const stmt = database.prepare(query.sql);
        const results = stmt.all(query.params);

        const records: KanbanCardRecord[] = results.map((result: any) => {
            const record: KanbanCardRecord = new KanbanCardRecord({
                id: result.ID,
                issue: result.ISSUE,
                status: result.STATUS,
                archived: result.ARCHIVED > 0 ? true : false,
                timesheet: new TimesheetRecord({
                    id: result.TIMESHEET_ID,
                    date: result.TIMESHEET_DATE,
                    category: result.TIMESHEET_CATEGORY,
                    timeSpent: result.TIMESHEET_TIME_SPENT,
                    description: result.TIMESHEET_DESCRIPTION,
                    relevantFacts: result.TIMESHEET_RELEVANT_FACTS,
                    deliveries: result.TIMESHEET_DELIVERIES,
                    context: result.TIMESHEET_CONTEXT
                })
            })
            return record;
        })

        return records;
    }

    _insertRecord(record: KanbanCardRecord): KanbanCardRecord {
        record = record.validated()

        const fields = ['ISSUE', 'STATUS', 'ARCHIVED', 'TIMESHEET_ID']
        const values = [record.issue, record.status, record.archived ? 1 : 0, record.timesheet?.id]

        const changes = database.insert('KANBAN_CARD', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        record.id = database.lastInsertRowId
        return record
    }

    _updateRecord(record: KanbanCardRecord): KanbanCardRecord {
        record = record.validated()

        const fields = ['ISSUE', 'STATUS', 'ARCHIVED']
        const values = [record.issue, record.status, record.archived ? 1 : 0]

        const changes = database.update('KANBAN_CARD', fields, values, `ID = ${record.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return record
    }

    mergeRecord(record: KanbanCardRecord): KanbanCardRecord {
        if (record.id) {
            return this._updateRecord(record)
        } else {
            return this._insertRecord(record)
        }
    }

    updateArchiveStatus(id: number, archived: boolean): boolean {
        const changes = database.update('KANBAN_CARD', ['ARCHIVED'], [archived ? 1 : 0], `ID = ${id}`);
        return changes > 0
    }

    updateStatus(id: number, status: string): boolean {
        const changes = database.update('KANBAN_CARD', ['STATUS'], [status], `ID = ${id}`);
        return changes > 0
    }

    deleteRecord(id: number): boolean {
        const changes = database.delete('KANBAN_CARD', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    parseRecord(data: any): KanbanCardRecord {
        const record = new KanbanCardRecord(data).validated()
        return record
    }
}

export {
    KanbanCardStore, KanbanCardRecord
}
