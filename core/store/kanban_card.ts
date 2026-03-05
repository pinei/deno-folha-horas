import assert from 'node:assert'
import database from '../database';
import { TimesheetRecord } from './timesheet';

class KanbanCardRecord {
    id = 0
    issue: string | null = null
    description: string | null = null
    status: string | null = null
    archived = false
    relevantFacts: string | null = null
    deliveries: string | null = null
    timesheets: TimesheetRecord[] = []

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
        this.checkRequired('status', 'Status is required')
        this.checkRequired('issue', 'Issue is required')

        return this
    }
}

class KanbanCardStore {
    _queryForListRecords(filter: any) {
        let { issue, status, archived, terms } = filter

        let sql = `select * from KANBAN_CARD where 1 = 1`
        let params: any = {}

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

        if (terms) {
            terms = `%${terms}%`
            sql += ` and (ISSUE like @terms or DESCRIPTION like @terms or RELEVANT_FACTS like @terms or DELIVERIES like @terms)`
            params['@terms'] = terms
        }

        if (filter.limit) {
            sql += ` LIMIT @limit`
            params['@limit'] = filter.limit
        }

        return {
            sql,
            params
        }
    }

    _loadTimesheets(kanbanCardId: number): TimesheetRecord[] {
        const sql = `select * from TIMESHEET where KANBAN_CARD_ID = @kanbanCardId order by DATE desc`
        const stmt = database.prepare(sql);
        const results = stmt.all({ '@kanbanCardId': kanbanCardId });

        return results.map((result: any) => {
            return new TimesheetRecord({
                id: result.ID,
                date: result.DATE,
                category: result.CATEGORY,
                timeSpent: result.TIME_SPENT,
                description: result.DESCRIPTION,
                context: result.CONTEXT,
                kanbanCardId: result.KANBAN_CARD_ID
            })
        })
    }

    unlinkRemovedTimesheets(kanbanCardId: number, keepIds: number[]) {
        if (keepIds.length === 0) {
            // Unlink all timesheets from this card
            database.update('TIMESHEET', ['KANBAN_CARD_ID'], [null], `KANBAN_CARD_ID = ${kanbanCardId}`)
        } else {
            const idList = keepIds.join(',')
            database.update('TIMESHEET', ['KANBAN_CARD_ID'], [null], `KANBAN_CARD_ID = ${kanbanCardId} AND ID NOT IN (${idList})`)
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
                description: result.DESCRIPTION,
                status: result.STATUS,
                archived: result.ARCHIVED > 0 ? true : false,
                relevantFacts: result.RELEVANT_FACTS,
                deliveries: result.DELIVERIES,
                timesheets: this._loadTimesheets(result.ID)
            })
            return record;
        })

        return records;
    }

    _insertRecord(record: KanbanCardRecord): KanbanCardRecord {
        record = record.validated()

        const fields = ['ISSUE', 'DESCRIPTION', 'STATUS', 'ARCHIVED', 'RELEVANT_FACTS', 'DELIVERIES']
        const values = [record.issue, record.description, record.status, record.archived ? 1 : 0, record.relevantFacts, record.deliveries]

        const changes = database.insert('KANBAN_CARD', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        record.id = database.lastInsertRowId
        return record
    }

    _updateRecord(record: KanbanCardRecord): KanbanCardRecord {
        record = record.validated()

        const fields = ['ISSUE', 'DESCRIPTION', 'STATUS', 'ARCHIVED', 'RELEVANT_FACTS', 'DELIVERIES']
        const values = [record.issue, record.description, record.status, record.archived ? 1 : 0, record.relevantFacts, record.deliveries]

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
