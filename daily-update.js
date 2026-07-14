// daily-update.js
import { runAllDailyJobs } from './src/jobs/daily-jobs.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  await runAllDailyJobs();
}

// Auto-execute
main().catch(error => {
  console.error('Error in daily updates:', error);
  process.exit(1);
});