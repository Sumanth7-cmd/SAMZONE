import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/rishi/Desktop/SAMZONE/frontend/.env' });

import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { runEngineSelfTest } from '../frontend/src/services/recommendationEngine';

const result = runEngineSelfTest();

console.log('=== recommendationEngine self-test ===');
console.log(`Passed: ${result.passed}`);
console.log(`Failed: ${result.failed}`);

if (result.errors.length > 0) {
  console.error('\nFailures:');
  for (const err of result.errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
}

console.log('\nAll self-tests passed.');
process.exit(0);
