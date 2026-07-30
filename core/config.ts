import { parseArgs } from 'node:util';

const DEFAULT_DB_PATH = './data/sqlite3.db';
const DEFAULT_HTTP_PORT = 1025;

export interface ServerConfig {
  dbPath: string;
  httpPort: number;
}

export function parseServerConfig(args: string[] = process.argv.slice(2)): ServerConfig {
  const { values } = parseArgs({
    args,
    options: {
      'db-path': { type: 'string' },
      port: { type: 'string' },
    },
    strict: true,
  });

  const dbPath = values['db-path'] ?? DEFAULT_DB_PATH;
  if (!dbPath.trim()) {
    throw new Error('--db-path must not be empty');
  }

  const httpPort = values.port === undefined ? DEFAULT_HTTP_PORT : Number(values.port);
  if (!Number.isInteger(httpPort) || httpPort < 1 || httpPort > 65535) {
    throw new Error('--port must be an integer between 1 and 65535');
  }

  return { dbPath, httpPort };
}

const serverConfig = parseServerConfig();

export default serverConfig;