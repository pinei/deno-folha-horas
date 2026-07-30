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
    private fields = [
        'CATEGORY', 'CATEGORY_COLOR', 'TIPO_ATIVIDADE', 'CENTRO_TRABALHO',
        'CENTRO', 'ELEMENTO_PEP', 'DIAGRAMA_REDE', 'OPERACAO',
        'SUBOPERACAO', 'PARTICAO', 'ACTIVE'
    ]

    private values(category: Category) {
        return [
            category.category,
            category.categoryColor,
            category.sap.tipoAtividade,
            category.sap.centroTrabalho,
            category.sap.centro,
            category.sap.elementoPep,
            category.sap.diagramaRede,
            category.sap.operacao,
            category.sap.subOperacao,
            category.sap.particao,
            category.active ? 1 : 0
        ]
    }

    private insert(category: Category): Category {
        category.validated()
        const changes = database.insert('SAP_CAT2_OBJECT', this.fields, this.values(category))

        assert(changes > 0, 'Changes should be greater than zero')
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero')

        category.id = database.lastInsertRowId
        return category
    }

    private update(category: Category): Category {
        category.validated()
        const changes = database.update(
            'SAP_CAT2_OBJECT',
            this.fields,
            this.values(category),
            `ID = ${category.id}`
        )

        assert(changes > 0, 'Changes should be greater than zero')
        return category
    }

    merge(category: Category): Category {
        return category.id ? this.update(category) : this.insert(category)
    }

    delete(id: number): boolean {
        const changes = database.delete('SAP_CAT2_OBJECT', `ID = ${id}`)
        assert(changes > 0, 'Changes should be greater than zero')
        return changes > 0
    }

    list(): Category[] {
        const results = database.select('SAP_CAT2_OBJECT', '*', '1 = 1', 'CATEGORY')

        return results.map((result: any) => new Category({
            id: result.ID,
            category: result.CATEGORY,
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
            'SAP_CAT2_OBJECT',
            'CATEGORY, CATEGORY_COLOR',
            'ACTIVE = 1',
            'CATEGORY'
        )

        return results.map((result: any) => new CategorySummary(result.CATEGORY, result.CATEGORY_COLOR))
    }
}

export { CategoryStore, Category, SAPData }