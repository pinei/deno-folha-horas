import assert from 'node:assert'
import database from '../database'

class SAPData {
    tipoAtividade: string | null = null
    elementoPep = ''
    diagramaRede = ''
    operacao = ''
    subOperacao = ''
    particao = ''
    centroTrabalho: string | null = null
    centro: string | null = null

    constructor(data: Partial<SAPData> = {}) {
        Object.assign(this, data)
    }
}

class Category {
    id = 0
    category: string | null = null
    categoryColor: string | null = null
    active = true
    sap: SAPData

    constructor(data: Partial<Category> = {}) {
        Object.assign(this, data)
        this.sap = new SAPData(data.sap)
    }

    private checkRequired(value: string | null, errorMessage: string) {
        if (!value || value.trim() === '') {
            throw new Error(errorMessage)
        }
    }

    validated() {
        this.checkRequired(this.category, 'Category is required')
        return this
    }
}

class CategorySummary {
    name: string
    color: string

    constructor(name: string, color: string) {
        this.name = name
        this.color = color
    }
}

class CategoryStore {
    private categoryFields = ['CATEGORY_NAME', 'CATEGORY_COLOR', 'ACTIVE']

    private categoryValues(category: Category) {
        return [
            category.category,
            category.categoryColor,
            category.active ? 1 : 0
        ]
    }

    private sapCodeFields = [
        'CATEGORY_ID', 'TIPO_ATIVIDADE', 'CENTRO_TRABALHO', 'CENTRO',
        'ELEMENTO_PEP', 'DIAGRAMA_REDE', 'OPERACAO', 'SUBOPERACAO', 'PARTICAO'
    ]

    private sapCodeValues(category: Category) {
        return [
            category.id,
            category.sap.tipoAtividade,
            category.sap.centroTrabalho,
            category.sap.centro,
            category.sap.elementoPep,
            category.sap.diagramaRede,
            category.sap.operacao,
            category.sap.subOperacao,
            category.sap.particao
        ]
    }

    private insert(category: Category): Category {
        category.validated()
        return database.transaction(() => {
            const categoryChanges = database.insert('CATEGORY', this.categoryFields, this.categoryValues(category))

            assert(categoryChanges > 0, 'Changes should be greater than zero')
            assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero')

            category.id = database.lastInsertRowId
            const sapCodeChanges = database.insert('SAP_CODE', this.sapCodeFields, this.sapCodeValues(category))
            assert(sapCodeChanges > 0, 'Changes should be greater than zero')

            return category
        })
    }

    private update(category: Category): Category {
        category.validated()
        return database.transaction(() => {
            const categoryStatement = database.prepare(`
                UPDATE CATEGORY
                SET CATEGORY_NAME = ?, CATEGORY_COLOR = ?, ACTIVE = ?
                WHERE ID = ?
            `)
            const categoryChanges = Number(categoryStatement.run(...this.categoryValues(category), category.id).changes)
            assert(categoryChanges > 0, 'Changes should be greater than zero')

            const sapCodeStatement = database.prepare(`
                UPDATE SAP_CODE
                SET TIPO_ATIVIDADE = ?, CENTRO_TRABALHO = ?, CENTRO = ?, ELEMENTO_PEP = ?,
                    DIAGRAMA_REDE = ?, OPERACAO = ?, SUBOPERACAO = ?, PARTICAO = ?
                WHERE CATEGORY_ID = ?
            `)
            const sapCodeChanges = Number(sapCodeStatement.run(...this.sapCodeValues(category).slice(1), category.id).changes)
            assert(sapCodeChanges > 0, 'Changes should be greater than zero')

            return category
        })
    }

    merge(category: Category): Category {
        return category.id ? this.update(category) : this.insert(category)
    }

    delete(id: number): boolean {
        const statement = database.prepare('DELETE FROM CATEGORY WHERE ID = ?')
        const changes = Number(statement.run(id).changes)
        assert(changes > 0, 'Changes should be greater than zero')
        return changes > 0
    }

    list(): Category[] {
        const results = database.query(`
            SELECT
                c.ID, c.CATEGORY_NAME, c.CATEGORY_COLOR, c.ACTIVE,
                s.TIPO_ATIVIDADE, s.ELEMENTO_PEP, s.DIAGRAMA_REDE, s.OPERACAO,
                s.SUBOPERACAO, s.PARTICAO, s.CENTRO_TRABALHO, s.CENTRO
            FROM CATEGORY c
            INNER JOIN SAP_CODE s ON s.CATEGORY_ID = c.ID
            ORDER BY c.CATEGORY_NAME
        `)

        return results.map((result: any) => new Category({
            id: result.ID,
            category: result.CATEGORY_NAME,
            categoryColor: result.CATEGORY_COLOR,
            active: result.ACTIVE > 0,
            sap: {
                tipoAtividade: result.TIPO_ATIVIDADE,
                elementoPep: result.ELEMENTO_PEP,
                diagramaRede: result.DIAGRAMA_REDE,
                operacao: result.OPERACAO,
                subOperacao: result.SUBOPERACAO,
                particao: result.PARTICAO,
                centroTrabalho: result.CENTRO_TRABALHO,
                centro: result.CENTRO
            }
        }))
    }

    listActive(): CategorySummary[] {
        const results = database.select(
            'CATEGORY',
            'CATEGORY_NAME, CATEGORY_COLOR',
            'ACTIVE = 1',
            'CATEGORY_NAME'
        )

        return results.map((result: any) => new CategorySummary(result.CATEGORY_NAME, result.CATEGORY_COLOR))
    }
}

export { CategoryStore, Category, SAPData }