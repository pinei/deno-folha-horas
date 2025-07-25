import assert from 'node:assert'
import database from '../database.ts';

class TimesheetRecord {
    id = 0
    date: Date | null = null
    category: string | null = null
    timeSpent = 0
    description = ''
    relevantFacts: string | null = null
    deliveries: string | null = null
    context: string | null = null

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

        if (this.relevantFacts && this.relevantFacts.trim() === '') {
            this.relevantFacts = null
        }

        if (this.deliveries && this.deliveries.trim() === '') {
            this.deliveries = null
        }

        if (this.context && this.context.trim() === '') {
            this.context = null
        }

        return this
    }
}

type TimesheetRecordProperties = keyof Pick<TimesheetRecord, { [K in keyof TimesheetRecord]: TimesheetRecord[K] extends Function ? never : K }[keyof TimesheetRecord]>
type TimesheetRecordFields = Exclude<TimesheetRecordProperties, 'id'>; 

class TimesheetStore {
    _queryForListRecords(filter) {
        const LIMIT = 500;
        const MIN_DATE = new Date('1900-01-01')
        const MAX_DATE = new Date('2100-01-01')

        let { startDate, endDate, category, terms } = filter

        const sqlStartDate = database.formatDate(startDate || MIN_DATE)
        const sqlEndDate = database.formatDate(endDate || MAX_DATE)

        let sql = `select * from TIMESHEET where DATE >= @sqlStartDate and DATE <= @sqlEndDate`

        let params = {
            '@sqlStartDate': sqlStartDate,
            '@sqlEndDate': sqlEndDate,
        }

        if (category) {
            sql += ` and CATEGORY = @category`
            params['@category'] = category
        }

        if (terms) {
            terms = `%${terms}%`
            sql += ` and (DESCRIPTION like @terms or RELEVANT_FACTS like @terms or DELIVERIES like @terms)`
            params['@terms'] = terms
        }

        return {
            sql,
            params
        }
    }

    listRecords(filter: any) : TimesheetRecord[] {
        filter = filter || {}

        const query = this._queryForListRecords(filter)

        const stmt = database.prepare(query.sql);
        const results = stmt.all(query.params);

        const records : TimesheetRecord[] = results.map((result : any) => {
            const record : TimesheetRecord = new TimesheetRecord({
                id: result.ID,
                date: result.DATE,
                category: result.CATEGORY,
                timeSpent: result.TIME_SPENT,
                description: result.DESCRIPTION,
                relevantFacts: result.RELEVANT_FACTS,
                deliveries: result.DELIVERIES,
                context: result.CONTEXT
            })
            return record;
        })

        return records;        
    }

    _insertRecord(record : TimesheetRecord) : TimesheetRecord {
        record = record.validated()

        // Todos os campos exceto o id
        const mapping: Record<TimesheetRecordFields, string> = {
            'date': 'DATE',
            'category': 'CATEGORY',
            'timeSpent': 'TIME_SPENT',
            'description': 'DESCRIPTION',
            'relevantFacts': 'RELEVANT_FACTS',
            'deliveries': 'DELIVERIES',
            'context': 'CONTEXT'
        }

        const fields = Object.keys(mapping).map((key : string) : string => mapping[key as TimesheetRecordFields]);
        const values = Object.keys(mapping).map((key : string) : any => record[key as TimesheetRecordFields]);

        const changes = database.insert('TIMESHEET', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        record.id = database.lastInsertRowId
        return record
    }

    _updateRecord(record : TimesheetRecord) : TimesheetRecord {
        record = record.validated()

        // Todos os campos exceto o id
        const mapping: Record<TimesheetRecordFields, string> = {
            'date': 'DATE',
            'category': 'CATEGORY',
            'timeSpent': 'TIME_SPENT',
            'description': 'DESCRIPTION',
            'relevantFacts': 'RELEVANT_FACTS',
            'deliveries': 'DELIVERIES',
            'context': 'CONTEXT'
        }

        const fields = Object.keys(mapping).map((key : string) : string => mapping[key as TimesheetRecordFields]);
        const values = Object.keys(mapping).map((key : string) : any => record[key as TimesheetRecordFields]);

        const changes = database.update('TIMESHEET', fields, values, `ID = ${record.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return record
    }

    mergeRecord(record : TimesheetRecord) : TimesheetRecord {
        if (record.id) {
            return this._updateRecord(record)
        } else {
            return this._insertRecord(record)
        }
    }

    deleteRecord(id : number) : boolean {
        const changes = database.delete('TIMESHEET', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    parseRecord(data : any) : TimesheetRecord {
        const record = new TimesheetRecord(data).validated()
        return record
    }
}

export {
    TimesheetStore, TimesheetRecord
}