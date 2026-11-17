#!/usr/bin/env node
import { execSync } from 'child_process';

try {
  const output = execSync('npx vitest run --reporter=verbose', {
    cwd: process.cwd(),
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  console.log(output);
} catch (error) {
  console.log(error.stdout || error.message);
  process.exit(1);
}
