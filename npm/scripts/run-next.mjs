#!/usr/bin/env node
import { spawn } from 'node:child_process';
import process from 'node:process';

if (!process.env.NEXT_IGNORE_INCORRECT_LOCKFILE) {
  process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = '1';
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-next.mjs <command> [...args]');
  process.exit(1);
}

const [command, ...commandArgs] = args;

const child = spawn('next', [command, ...commandArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

