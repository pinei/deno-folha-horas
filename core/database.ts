import assert from 'node:assert'
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = './data/sqlite3.db'

const SQL_SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS SCHEMA_VERSION (
    ID integer primary key autoincrement,
    DATETIME text,
    VERSION text,
    DESCRIPTION text
  );
`

const SQL_MIGRATE = [
  {
    version: '1.0.0',
    description: 'Initial version',
    sql: `
      CREATE TABLE IF NOT EXISTS TIMESHEET (
        ID integer primary key autoincrement,
        DATE text,
        CATEGORY text,
        TIME_SPENT numeric,
        DESCRIPTION text
      );

      CREATE TABLE IF NOT EXISTS SAP_CAT2_OBJECT (
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
        CENTRO text
      );
    `
  },
  {
    version: '1.1.0',
    description: 'Fatos relevantes e entregas',
    sql: `
      ALTER TABLE TIMESHEET ADD COLUMN RELEVANT_FACTS text;
      ALTER TABLE TIMESHEET ADD COLUMN DELIVERIES text;
    `
  },
  {
    version: '1.2.0',
    description: 'Contexto',
    sql: `
      ALTER TABLE TIMESHEET ADD COLUMN CONTEXT text;
    `
  },
  {
    version: '1.3.0',
    description: 'Category color',
    sql: `
      ALTER TABLE SAP_CAT2_OBJECT ADD COLUMN CATEGORY_COLOR text;
    `
  },
  {
    version: '1.4.0',
    description: 'Kanban Card Table (standalone, no TIMESHEET_ID FK)',
    sql: `
      CREATE TABLE IF NOT EXISTS KANBAN_CARD (
        ID integer primary key autoincrement,
        ISSUE text,
        DESCRIPTION text,
        STATUS text,
        ARCHIVED integer,
        RELEVANT_FACTS text,
        DELIVERIES text
      );
    `
  },
  {
    version: '1.4.1',
    description: 'Add KANBAN_CARD_ID FK on TIMESHEET',
    sql: `
      ALTER TABLE TIMESHEET ADD COLUMN KANBAN_CARD_ID integer REFERENCES KANBAN_CARD(ID) ON DELETE SET NULL;
    `
  },
  {
    version: '1.4.2',
    description: 'Data migration: create KANBAN_CARD for TIMESHEETs with RELEVANT_FACTS or DELIVERIES',
    sql: `
      INSERT INTO KANBAN_CARD (ISSUE, DESCRIPTION, RELEVANT_FACTS, DELIVERIES, STATUS, ARCHIVED)
        SELECT CONTEXT, DESCRIPTION, RELEVANT_FACTS, DELIVERIES, 'DONE', 1
        FROM TIMESHEET
        WHERE (RELEVANT_FACTS IS NOT NULL AND RELEVANT_FACTS != '')
           OR (DELIVERIES IS NOT NULL AND DELIVERIES != '');

      UPDATE TIMESHEET
        SET KANBAN_CARD_ID = (
          SELECT KC.ID FROM KANBAN_CARD KC
          WHERE KC.ISSUE = TIMESHEET.CONTEXT
            AND KC.DESCRIPTION = TIMESHEET.DESCRIPTION
            AND (KC.RELEVANT_FACTS IS TIMESHEET.RELEVANT_FACTS)
            AND (KC.DELIVERIES IS TIMESHEET.DELIVERIES)
          LIMIT 1
        )
        WHERE (RELEVANT_FACTS IS NOT NULL AND RELEVANT_FACTS != '')
           OR (DELIVERIES IS NOT NULL AND DELIVERIES != '');
    `
  },
  {
    version: '1.4.3',
    description: 'Drop RELEVANT_FACTS and DELIVERIES from TIMESHEET',
    sql: `
      ALTER TABLE TIMESHEET DROP COLUMN RELEVANT_FACTS;
      ALTER TABLE TIMESHEET DROP COLUMN DELIVERIES;
    `
  },
]


class SQLDatabase {
  _conn: DatabaseSync;
  _lastInsertRowId: number = 0;

  constructor(path: string) {
    this._conn = new DatabaseSync(path);
  }

  migrate() {
    // this._conn.exec(SQL_MIGRATE);
    this._conn.exec(SQL_SCHEMA_VERSION);

    const versions = this.select('SCHEMA_VERSION', 'VERSION').map((row) => row.VERSION);

    for (const migration of SQL_MIGRATE) {
      if (!versions.includes(migration.version)) {
        console.log(`Migrating to version ${migration.version}: ${migration.description}`);
        this.exec(migration.sql);
        this.insert('SCHEMA_VERSION', ['DATETIME', 'VERSION', 'DESCRIPTION'], [new Date().toISOString(), migration.version, migration.description]);
      }
    }
  }

  prepare(sql: string) {
    return this._conn.prepare(sql);
  }

  insert(table: string, fields: string[], values: any[]): number {
    const stmt = this.prepare(`insert into ${table} (${fields.join(', ')}) values (${fields.map(() => '?').join(', ')})`);
    const info = stmt.run(...values);
    this._lastInsertRowId = Number(info.lastInsertRowid);
    return info.changes;
  }

  update(table: string, fields: string[], values: any[], where: string): number {
    const stmt = this.prepare(`update ${table} set ${fields.map((field) => `${field} = ?`).join(', ')} where ${where}`);
    const info = stmt.run(...values);
    return info.changes;
  }

  delete(table: string, where: string): number {
    const stmt = this.prepare(`delete from ${table} where ${where}`);
    const info = stmt.run();
    return info.changes;
  }

  select(table: string, fields = '*', where = '1 = 1', orderBy = '1'): any[] {
    const stmt = this.prepare(`select ${fields} from ${table} where ${where} order by ${orderBy}`);
    return stmt.all();
  }

  exec(sql: string): number {
    this._conn.exec(sql);
    return 1;
  }

  query(sql: string): any[] {
    const stmt = this.prepare(sql);
    return stmt.all();
  }

  get lastInsertRowId(): number {
    return this._lastInsertRowId;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  parseDate(date: string): Date | null {
    if (/^(\d{4}-\d{2}-\d{2})$/.test(date)) {
      // Parsing as local time
      // https://codeofmatt.com/javascript-date-parsing-changes-in-es6
      date = date.replace(/-/g, '/');
      return new Date(date);
    }
    return null;
  }
}

const database = new SQLDatabase(DB_PATH);
database.migrate();

export default database