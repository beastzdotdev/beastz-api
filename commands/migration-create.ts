import * as readline from 'readline';
import { createMigrationFile } from '../src/common/migrate';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Create migration file name: ', migrationPostFixName => {
  createMigrationFile(migrationPostFixName);
  process.exit(1);
});
