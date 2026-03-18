import assert from 'node:assert'
import database from '../database';

class TimesheetRecord {
    id = 0
    date: Date | null = null
    category: string | null = null
    timeSpent = 0
    description = ''
    context: string | null = null
    kanbanCard?: {
        id: number
        issue?: string | null
        description?: string | null
        status?: string | null
        relevantFacts?: string | null
        deliveries?: string | null
    } | null = null

    constructor(data: Partial<TimesheetRecord>) {
        Object.assign(this, data)
    }

    checkRequired(field: keyof TimesheetRecord, errorMessage: string) {
        const value = this[field];
        if (!value || (typeof value === 'string' && value.trim() == '')) {
            throw new Error(errorMessage);
        }
    }

    validated() {
        this.checkRequired('date', 'Date is required')
        this.checkRequired('category', 'Category is required')
        this.checkRequired('timeSpent', 'Time is required')
        this.checkRequired('description', 'Description is required')

        if (isNaN(this.timeSpent)) throw new Error('Time is invalid')

        if (typeof this.timeSpent === 'string') {
            this.timeSpent = parseFloat(this.timeSpent)
        }

        if (this.context && this.context.trim() === '') {
            this.context = null
        }

        return this
    }
}

class TimesheetStore {
    _queryForListRecords(filter) {
        const LIMIT = 500;
        const MIN_DATE = new Date('1900-01-01')
        const MAX_DATE = new Date('2100-01-01')

        let { startDate, endDate, category, terms } = filter

        const sqlStartDate = database.formatDate(startDate || MIN_DATE)
        const sqlEndDate = database.formatDate(endDate || MAX_DATE)

        let sql = `select
                t.*,
                k.ISSUE as KANBAN_ISSUE,
                k.DESCRIPTION as KANBAN_DESCRIPTION,
                k.STATUS as KANBAN_STATUS,
                k.RELEVANT_FACTS as KANBAN_RELEVANT_FACTS,
                k.DELIVERIES as KANBAN_DELIVERIES
            from TIMESHEET t ` +
            `left join KANBAN_CARD k on t.KANBAN_CARD_ID = k.ID ` +
            `where t.DATE >= @sqlStartDate and t.DATE <= @sqlEndDate`

        let params: any = {
            '@sqlStartDate': sqlStartDate,
            '@sqlEndDate': sqlEndDate,
        }

        if (category) {
            sql += ` and t.CATEGORY = @category`
            params['@category'] = category
        }

        if (terms) {
            terms = `%${terms}%`
            sql += ` and (t.DESCRIPTION like @terms or t.CONTEXT like @terms)`
            params['@terms'] = terms
        }

        return {
            sql,
            params
        }
    }

    listRecords(filter: any): TimesheetRecord[] {
        filter = filter || {}

        const query = this._queryForListRecords(filter)

        const stmt = database.prepare(query.sql);
        const results = stmt.all(query.params);

        const records: TimesheetRecord[] = results.map((result: any) => {
            const record: TimesheetRecord = new TimesheetRecord({
                id: result.ID,
                date: result.DATE,
                category: result.CATEGORY,
                timeSpent: result.TIME_SPENT,
                description: result.DESCRIPTION,
                context: result.CONTEXT,
                kanbanCard: result.KANBAN_CARD_ID ? {
                    id: result.KANBAN_CARD_ID,
                    issue: result.KANBAN_ISSUE,
                    description: result.KANBAN_DESCRIPTION,
                    status: result.KANBAN_STATUS,
                    relevantFacts: result.KANBAN_RELEVANT_FACTS,
                    deliveries: result.KANBAN_DELIVERIES
                } : null
            })
            return record;
        })

        return records;
    }

    _insertRecord(record: TimesheetRecord): TimesheetRecord {
        record = record.validated()

        const fields = ['DATE', 'CATEGORY', 'TIME_SPENT', 'DESCRIPTION', 'CONTEXT', 'KANBAN_CARD_ID']
        const values = [record.date, record.category, record.timeSpent, record.description, record.context, record.kanbanCard?.id ?? null]

        const changes = database.insert('TIMESHEET', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        record.id = database.lastInsertRowId
        return record
    }

    _updateRecord(record: TimesheetRecord): TimesheetRecord {
        record = record.validated()

        const fields = ['DATE', 'CATEGORY', 'TIME_SPENT', 'DESCRIPTION', 'CONTEXT', 'KANBAN_CARD_ID']
        const values = [record.date, record.category, record.timeSpent, record.description, record.context, record.kanbanCard?.id ?? null]

        const changes = database.update('TIMESHEET', fields, values, `ID = ${record.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return record
    }

    mergeRecord(record: TimesheetRecord): TimesheetRecord {
        if (record.id) {
            return this._updateRecord(record)
        } else {
            return this._insertRecord(record)
        }
    }

    deleteRecord(id: number): boolean {
        const changes = database.delete('TIMESHEET', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    linkKanbanCard(timesheetId: number, kanbanCardId: number): TimesheetRecord {
        const changes = database.update('TIMESHEET', ['KANBAN_CARD_ID'], [kanbanCardId], `ID = ${timesheetId}`);
        assert(changes > 0, 'Changes should be greater than zero');

        const sql = `select
                t.*,
                k.ISSUE as KANBAN_ISSUE,
                k.DESCRIPTION as KANBAN_DESCRIPTION,
                k.STATUS as KANBAN_STATUS,
                k.RELEVANT_FACTS as KANBAN_RELEVANT_FACTS,
                k.DELIVERIES as KANBAN_DELIVERIES
            from TIMESHEET t
            left join KANBAN_CARD k on t.KANBAN_CARD_ID = k.ID
            where t.ID = @timesheetId`

        const stmt = database.prepare(sql);
        const result: any = stmt.get({ '@timesheetId': timesheetId });

        return new TimesheetRecord({
            id: result.ID,
            date: result.DATE,
            category: result.CATEGORY,
            timeSpent: result.TIME_SPENT,
            description: result.DESCRIPTION,
            context: result.CONTEXT,
            kanbanCard: result.KANBAN_CARD_ID ? {
                id: result.KANBAN_CARD_ID,
                issue: result.KANBAN_ISSUE,
                description: result.KANBAN_DESCRIPTION,
                status: result.KANBAN_STATUS,
                relevantFacts: result.KANBAN_RELEVANT_FACTS,
                deliveries: result.KANBAN_DELIVERIES
            } : null
        })
    }

    parseRecord(data: any): TimesheetRecord {
        const record = new TimesheetRecord(data).validated()
        return record
    }
}

export {
    TimesheetStore, TimesheetRecord
}