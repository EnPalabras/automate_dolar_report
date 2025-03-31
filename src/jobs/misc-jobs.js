import config from '../config/index.js';
import sheetsClient, { getRows } from '../services/sheets-client.js';
import { combinedReportRepository } from '../repositories/other-repositories.js';
import { formatDate, getNextDay } from '../utils/data-processors.js';
import logger from '../utils/logger.js';

// Spreadsheet IDs
const PAID_CHANNELS_SPREADSHEET_ID = config.google.spreadsheets.paidChannels;

/**
 * Process combined report data
 */
export const combinedReportJob = async () => {
  logger.start('Combined Report');
  try {
    const data = await getRows('Combined by Day!A2:H', PAID_CHANNELS_SPREADSHEET_ID);
    
    const valuesClause = sheetsClient.formatRowsForSql(data, (row) => {
      return `(${row.map((value, index) => {
        if (index > 2) return value;
        return `'${value.replaceAll("'", '')}'`;
      }).join(', ')})`;
    });
    
    await combinedReportRepository.updateCombinedReport(valuesClause);
    logger.success('Combined Report data updated successfully');
  } catch (error) {
    logger.error('Failed to process Combined Report data', error);
  }
  logger.end('Combined Report');
};
/**
 * Run all miscellaneous jobs
 */
export const runAllMiscJobs = async () => {
  try {
    await combinedReportJob();
    logger.success('Miscellaneous jobs completed successfully');
  } catch (error) {
    logger.error('Error running miscellaneous jobs', error);
    throw error;
  }
};