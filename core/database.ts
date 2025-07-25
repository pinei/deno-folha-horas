// deno-lint-ignore-file no-explicit-any
import assert from 'node:assert'
import { Database, Statement } from "https://deno.land/x/sqlite3/mod.ts";

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
]


interface SQLStatement extends Statement {
  run: (...args: any) => number;
  all: (...args: any) => any[];
}

class SQLDatabase {
  _conn: Database;

  constructor(path: string) {
    this._conn = new Database(path);
    assert(this._conn.open == true)
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

  prepare(sql: string) : SQLStatement {
    return this._conn.prepare(sql);
  }

  insert(table: string, fields: string[], values: any[]) : number {
    const stmt = this.prepare(`insert into ${table} (${fields.join(', ')}) values (${fields.map(() => '?').join(', ')})`);
    return stmt.run(...values);
  }

  update(table: string, fields: string[], values: any[], where: string) : number {
    const stmt = this.prepare(`update ${table} set ${fields.map((field) => `${field} = ?`).join(', ')} where ${where}`);
    return stmt.run(...values);
  }

  delete(table: string, where: string) : number {
    const stmt = this.prepare(`delete from ${table} where ${where}`);
    return stmt.run();
  }

  select(table: string, fields = '*', where = '1 = 1', orderBy = '1') : any[] {
    const stmt = this.prepare(`select ${fields} from ${table} where ${where} order by ${orderBy}`);
    return stmt.all();
  }

  exec(sql: string) : number {
    return this._conn.exec(sql);
  }

  query(sql: string) : any[] {
    const stmt = this.prepare(sql);
    return stmt.all();
  }

  get lastInsertRowId() : number {
    return this._conn.lastInsertRowId;
  }

  formatDate(date: Date) : string {
    return date.toISOString().split('T')[0];
  }

  parseDate(date: string) : Date | null {
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