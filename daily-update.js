// daily-update.js
import { runAllDailyJobs } from './src/jobs/daily-jobs.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Starting daily updates...');
  await runAllDailyJobs();
  console.log('Daily updates completed.');
}

// Auto-execute
main().catch(error => {
  console.error('Error in daily updates:', error);
  process.exit(1);
});