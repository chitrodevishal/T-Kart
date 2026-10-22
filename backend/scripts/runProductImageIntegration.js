import 'dotenv/config';
import { spawnSync } from 'node:child_process';

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required for the isolated integration test');
process.env.RUN_PRODUCT_IMAGE_API_INTEGRATION = 'true';
const result = spawnSync(process.execPath, ['--use-system-ca', '--test', 'tests/productImageApi.integration.test.js'], {
  env: process.env,
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
