import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'

const migrationVersions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.4.1', '1.4.2', '1.4.3', '1.5.0']

test('migrates legacy categories and SAP codes to a one-to-one schema', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'timesheet-categories-'))
    const databasePath = join(directory, 'timesheet.db')
    const legacyDatabase = new DatabaseSync(databasePath)
    let applicationDatabase: { close(): void } | null = null

    try {
        legacyDatabase.exec(`
            CREATE TABLE SCHEMA_VERSION (
                ID integer primary key autoincrement,
                DATETIME text,
                VERSION text,
                DESCRIPTION text
            );
            CREATE TABLE SAP_CAT2_OBJECT (
                ID integer primary key autoincrement,
                ACTIVE integer,
                CATEGORY text,
                TIPO_ATIVIDADE text,
                ELEMENTO_PEP text,
                DIAGRAMA_REDE text,
                OPERACAO text,
                SUBOPERACAO text,
                PARTICAO text,
                CENTRO_TRABALHO text,
                CENTRO text,
                CATEGORY_COLOR text
            );
            CREATE TABLE TIMESHEET (
                ID integer primary key autoincrement,
                DATE text,
                CATEGORY text,
                TIME_SPENT numeric,
                DESCRIPTION text,
                CONTEXT text,
                KANBAN_CARD_ID integer
            );
        `)

        const insertVersion = legacyDatabase.prepare('INSERT INTO SCHEMA_VERSION (DATETIME, VERSION, DESCRIPTION) VALUES (?, ?, ?)')
        for (const version of migrationVersions) {
            insertVersion.run('2026-01-01T00:00:00.000Z', version, 'Fixture')
        }

        const insertLegacyCategory = legacyDatabase.prepare(`
            INSERT INTO SAP_CAT2_OBJECT (
                ID, ACTIVE, CATEGORY, TIPO_ATIVIDADE, ELEMENTO_PEP, DIAGRAMA_REDE,
                OPERACAO, SUBOPERACAO, PARTICAO, CENTRO_TRABALHO, CENTRO, CATEGORY_COLOR
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        insertLegacyCategory.run(2, 1, 'DUPLICATE', 'AT1', 'PEP1', 'NET1', '10', '1', 'A', 'WORK1', '1000', 'red')
        insertLegacyCategory.run(8, 0, 'DUPLICATE', null, null, null, null, null, null, null, null, 'blue')

        legacyDatabase.prepare(`
            INSERT INTO TIMESHEET (DATE, CATEGORY, TIME_SPENT, DESCRIPTION, CONTEXT)
            VALUES (?, ?, ?, ?, ?)
        `).run('2026-07-30', 'DUPLICATE', 1, 'Legacy record', 'Context')

        process.argv.push('--db-path', databasePath)
        const [{ default: database }, { CategoryStore, Category }, { TimesheetReport }] = await Promise.all([
            import('./database.ts'),
            import('./store/categories.ts'),
            import('./store/timesheet-report.ts')
        ])
        applicationDatabase = database

        assert.equal(database.query(`SELECT COUNT(*) AS COUNT FROM CATEGORY`)[0].COUNT, 2)
        assert.equal(database.query(`SELECT COUNT(*) AS COUNT FROM SAP_CODE`)[0].COUNT, 2)
        assert.deepEqual(
            database.query(`SELECT ID, CATEGORY_ID FROM SAP_CODE ORDER BY ID`).map((row) => ({ ...row })),
            [{ ID: 2, CATEGORY_ID: 2 }, { ID: 8, CATEGORY_ID: 8 }]
        )
        assert.deepEqual(database.query('PRAGMA foreign_key_check'), [])
        assert.equal(database.query(`SELECT COUNT(*) AS COUNT FROM sqlite_master WHERE type = 'table' AND name = 'SAP_CAT2_OBJECT'`)[0].COUNT, 0)

        const store = new CategoryStore()
        assert.equal(store.list().length, 2)
        assert.deepEqual(store.listActive().map((category) => category.name), ['DUPLICATE'])

        const categoryToUpdate = store.list().find((category) => category.id === 2)
        assert.ok(categoryToUpdate)
        categoryToUpdate.categoryColor = 'yellow'
        categoryToUpdate.sap.tipoAtividade = 'UPDATED'
        store.merge(categoryToUpdate)
        assert.deepEqual(
            database.query(`
                SELECT c.CATEGORY_COLOR, s.TIPO_ATIVIDADE
                FROM CATEGORY c
                INNER JOIN SAP_CODE s ON s.CATEGORY_ID = c.ID
                WHERE c.ID = 2
            `).map((row) => ({ ...row })),
            [{ CATEGORY_COLOR: 'yellow', TIPO_ATIVIDADE: 'UPDATED' }]
        )

        const inserted = store.merge(new Category({
            id: 0,
            category: 'NEW_CATEGORY',
            categoryColor: 'green',
            active: true
        }))
        assert.ok(inserted.id > 8)

        assert.equal(store.delete(2), true)
        assert.equal(database.query(`SELECT COUNT(*) AS COUNT FROM SAP_CODE WHERE CATEGORY_ID = 2`)[0].COUNT, 0)

        const report = new TimesheetReport().monthTimeReport('2026', '07')
        assert.equal(report.length, 1)
        assert.equal(report[0].CATEGORY, 'DUPLICATE')
    } finally {
        applicationDatabase?.close()
        legacyDatabase.close()
        rmSync(directory, { recursive: true, force: true })
    }
})