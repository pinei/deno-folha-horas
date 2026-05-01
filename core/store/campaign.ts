import assert from 'node:assert'
import database from '../database';

export class Campaign {
    id = 0
    name: string | null = null
    type: string | null = null
    description: string | null = null
    startDate: string | null = null
    endDate: string | null = null
    archived = false

    constructor(data: Partial<Campaign>) {
        Object.assign(this, data)
    }

    checkRequired(field: keyof Campaign, errorMessage: string) {
        const value = this[field];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() == '')) {
            throw new Error(errorMessage);
        }
    }

    validated() {
        this.checkRequired('name', 'Name is required')
        this.checkRequired('type', 'Type is required')
        return this
    }
}

export class CampaignStore {
    _queryForListCampaigns(filter: any) {
        let { name, type, archived, terms } = filter

        let sql = `select * from CAMPAIGN where 1 = 1`
        let params: any = {}

        if (name) {
            sql += ` and NAME = @name`
            params['@name'] = name
        }

        if (type) {
            sql += ` and TYPE = @type`
            params['@type'] = type
        }

        if (archived !== undefined) {
            sql += ` and ARCHIVED = @archived`
            params['@archived'] = archived ? 1 : 0
        }

        if (terms) {
            terms = `%${terms}%`
            sql += ` and (NAME like @terms or DESCRIPTION like @terms)`
            params['@terms'] = terms
        }

        sql += ` ORDER BY START_DATE DESC, NAME ASC`

        return {
            sql,
            params
        }
    }

    listCampaigns(filter: any): Campaign[] {
        filter = filter || {}

        const query = this._queryForListCampaigns(filter)

        const stmt = database.prepare(query.sql);
        const results = stmt.all(query.params);

        const campaigns: Campaign[] = results.map((result: any) => {
            return new Campaign({
                id: result.ID,
                name: result.NAME,
                type: result.TYPE,
                description: result.DESCRIPTION,
                startDate: result.START_DATE,
                endDate: result.END_DATE,
                archived: result.ARCHIVED > 0 ? true : false
            });
        })

        return campaigns;
    }

    _insertCampaign(campaign: Campaign): Campaign {
        campaign = campaign.validated()

        const fields = ['NAME', 'TYPE', 'DESCRIPTION', 'START_DATE', 'END_DATE', 'ARCHIVED']
        const values = [campaign.name, campaign.type, campaign.description, campaign.startDate, campaign.endDate, campaign.archived ? 1 : 0]

        const changes = database.insert('CAMPAIGN', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        campaign.id = database.lastInsertRowId
        return campaign
    }

    _updateCampaign(campaign: Campaign): Campaign {
        campaign = campaign.validated()

        const fields = ['NAME', 'TYPE', 'DESCRIPTION', 'START_DATE', 'END_DATE', 'ARCHIVED']
        const values = [campaign.name, campaign.type, campaign.description, campaign.startDate, campaign.endDate, campaign.archived ? 1 : 0]

        const changes = database.update('CAMPAIGN', fields, values, `ID = ${campaign.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return campaign
    }

    mergeCampaign(campaign: Campaign): Campaign {
        if (campaign.id) {
            return this._updateCampaign(campaign)
        } else {
            return this._insertCampaign(campaign)
        }
    }

    deleteCampaign(id: number): boolean {
        const changes = database.delete('CAMPAIGN', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    parseCampaign(data: any): Campaign {
        return new Campaign(data).validated()
    }
}
