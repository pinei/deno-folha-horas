import assert from 'node:assert'
import database from '../database.ts';

/*
 * Interação com a base de dados.
 *
 * O objeto `database` tem as funções: select, delete, update, insert
 */

class SAPCode {
    id = 0
    active = true
    category: string | null = null
    categoryColor: string | null = null
    tipoAtividade: string | null = null
    elementoPep = ''
    diagramaRede = ''
    operacao = ''
    subOperacao = ''
    particao = ''
    centroTrabalho: string | null = null
    centro: string | null = null

    constructor(data: Partial<SAPCode>) {
        Object.assign(this, data)
        console.log('data: ' + JSON.stringify(data))
        console.log('SAPCode: ' + JSON.stringify(this))
    }

    checkRequired(field: keyof SAPCode, errorMessage: string) {
        const value = this[field];
        if (!value || (typeof value === 'string' && value.trim() == '')) {
            throw new Error(errorMessage);
        }
    }

    validated() {
        this.checkRequired('category', 'Category is required')
        this.checkRequired('tipoAtividade', 'Tipo Atividade is required')
        this.checkRequired('centroTrabalho', 'Centro de Trabalho is required')
        this.checkRequired('centro', 'Centro is required')

        return this
    }
}

class Category {
    name: string
    color: string

    constructor(name: string, color: string) {
        this.name = name
        this.color = color
    }
}

type SAPCodeProperties = keyof Pick<SAPCode, { [K in keyof SAPCode]: SAPCode[K] extends Function ? never : K }[keyof SAPCode]>
type SAPCodeFields = Exclude<SAPCodeProperties, 'id'>; 

class SAPCodeStore {
    // Todos os campos exceto o id
    mapping: Record<SAPCodeFields, string> = {
        'category': 'CATEGORY',
        'categoryColor': 'CATEGORY_COLOR',
        'tipoAtividade': 'TIPO_ATIVIDADE',
        'centroTrabalho': 'CENTRO_TRABALHO',
        'centro': 'CENTRO',
        'elementoPep': 'ELEMENTO_PEP',
        'diagramaRede': 'DIAGRAMA_REDE',
        'operacao': 'OPERACAO',
        'subOperacao': 'SUBOPERACAO',
        'particao': 'PARTICAO',
        'active': 'ACTIVE'
    }

    _insertObject(object: SAPCode) : SAPCode {
        object.validated()


        const fields = Object.keys(this.mapping).map((key : string) : string => this.mapping[key as SAPCodeFields]);
        const values = Object.keys(this.mapping).map((key : string) : any => object[key as SAPCodeFields]);

        const index = fields.indexOf('ACTIVE')
        values[index] = values[index] ? 1 : 0

        const changes = database.insert('SAP_CAT2_OBJECT', fields, values);

        assert(changes > 0, 'Changes should be greater than zero');
        assert(database.lastInsertRowId > 0, 'Row ID should be greater than zero');

        object.id = database.lastInsertRowId
        return object
    }

    _updateObject(object: SAPCode) : SAPCode {
        object.validated()

        const fields = Object.keys(this.mapping).map((key : string) : string => this.mapping[key as SAPCodeFields]);
        const values = Object.keys(this.mapping).map((key : string) : any => object[key as SAPCodeFields]);

        const index = fields.indexOf('ACTIVE')
        values[index] = values[index] ? 1 : 0

        const changes = database.update('SAP_CAT2_OBJECT', fields, values, `ID = ${object.id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return object
    }

    mergeObject(object: SAPCode) {
        if (object.id) {
            return this._updateObject(object)
        }
        else {
            return this._insertObject(object)
        }
    }

    deleteObject(id : number) {
        const changes = database.delete('SAP_CAT2_OBJECT', `ID = ${id}`);

        assert(changes > 0, 'Changes should be greater than zero');
        return changes > 0
    }

    listObjects() : SAPCode[] {
        const results = database.select('SAP_CAT2_OBJECT', '*', '1 = 1', 'CATEGORY');

        const objects : SAPCode[] = results.map((result : any) => {
            return new SAPCode({
                id: result.ID,
                active: result.ACTIVE > 0 ? true : false,
                category: result.CATEGORY,
                categoryColor: result.CATEGORY_COLOR,
                tipoAtividade: result.TIPO_ATIVIDADE,
                elementoPep: result.ELEMENTO_PEP,
                diagramaRede: result.DIAGRAMA_REDE,
                operacao: result.OPERACAO,
                subOperacao: result.SUBOPERACAO,
                particao: result.PARTICAO,
                centroTrabalho: result.CENTRO_TRABALHO,
                centro: result.CENTRO
            })
        })

        return objects        
    }

    listCategories() : Category[] {
        const results = database.select('SAP_CAT2_OBJECT', 'CATEGORY, CATEGORY_COLOR', 'ACTIVE = 1')
        
        return results.map((result : any) => {
            return new Category(result.CATEGORY, result.CATEGORY_COLOR)
        })
    }
}

export {
    SAPCodeStore, SAPCode
}