import 'dotenv/config';
import { spawnSync } from 'node:child_process';

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required for the isolated DummyJSON integration test');
process.env.RUN_DUMMYJSON_IMPORT_INTEGRATION = 'true';
const result = spawnSync(process.execPath, ['--use-system-ca', '--test', 'tests/dummyJsonImporter.integration.test.js'], {
  env: process.env,
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
