import assert from 'node:assert'
import database from '../database';
import { TimesheetRecord } from './timesheet';

class KanbanCard {
    id = 0
    issue: string | null = null
    description: string | null = null
    status: string | null = null
    archived = false
    relevantFacts: string | null = null
    deliveries: string | null = null
    timesheets: TimesheetRecord[] = []

    constructor(data: Partial<KanbanCard>) {
        Object.assign(this, data)
    }

    checkRequired(field: keyof KanbanCard, errorMessage: string) {
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
    _queryForListCards(filter: any) {
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
                context: result.CONTEXT
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

    listCards(filter: any): KanbanCard[] {
        filter = filter || {}

        const query = this._queryForListCards(filter)

        const stmt = database.prepare(query.sql);
        const results = stmt.all(query.params);

        const cards: KanbanCard[] = results.map((result: any) => {
            const card: KanbanCard = new KanbanCard({
                id: result.ID,
                issue: result.ISSUE,
                description: result.DESCRIPTION,
                status: result.STATUS,
                archived: result.ARCHIVED > 0 ? true : false,
                relevantFacts: result.RELEVANT_FACTS,
                deliveries: result.DELIVERIES,
                timesheets: this._loadTimesheets(result.ID)
            })
            return card;
        })

        return cards;
    }

    _insertCard(card: KanbanCard): KanbanCard {
        card = card.validated()

        const fields = ['ISSUE', 'DESCRIPTION', 'STATUS', 'ARCHIVED', 'RELEVANT_FACTS', 'DELIVERIES']
        const values = [card.issue, card.description, card.status, card.archived ? 1 : 0, card.relevantFacts, card.deliveries]

        const changes = database.insert('KANBAN_CARD', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        card.id = database.lastInsertRowId
        return card
    }

    _updateCard(card: KanbanCard): KanbanCard {
        card = card.validated()

        const fields = ['ISSUE', 'DESCRIPTION', 'STATUS', 'ARCHIVED', 'RELEVANT_FACTS', 'DELIVERIES']
        const values = [card.issue, card.description, card.status, card.archived ? 1 : 0, card.relevantFacts, card.deliveries]

        const changes = database.update('KANBAN_CARD', fields, values, `ID = ${card.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return card
    }

    mergeCard(card: KanbanCard): KanbanCard {
        if (card.id) {
            return this._updateCard(card)
        } else {
            return this._insertCard(card)
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

    deleteCard(id: number): boolean {
        const changes = database.delete('KANBAN_CARD', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    listAvailableCards(): KanbanCard[] {
        const sql_only_orphans = `SELECT * FROM KANBAN_CARD
            WHERE STATUS != 'DONE'
              AND ID NOT IN (SELECT DISTINCT KANBAN_CARD_ID FROM TIMESHEET WHERE KANBAN_CARD_ID IS NOT NULL)
            ORDER BY ISSUE`

        const sql_all = `SELECT * FROM KANBAN_CARD
            WHERE STATUS != 'DONE'
            ORDER BY ISSUE`

        const stmt = database.prepare(sql_all);
        const results = stmt.all();

        return results.map((result: any) => {
            return new KanbanCard({
                id: result.ID,
                issue: result.ISSUE,
                description: result.DESCRIPTION,
                status: result.STATUS,
                archived: result.ARCHIVED > 0 ? true : false,
                relevantFacts: result.RELEVANT_FACTS,
                deliveries: result.DELIVERIES,
                timesheets: this._loadTimesheets(result.ID)
            })
        })
    }

    parseCard(data: any): KanbanCard {
        const card = new KanbanCard(data).validated()
        return card
    }
}

export {
    KanbanCardStore, KanbanCard
}
