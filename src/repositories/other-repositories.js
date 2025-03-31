import db from '../services/db-client.js';
import logger from '../utils/logger.js';


export const combinedReportRepository = {
  /**
   * Update combined report data
   * @param {string} valuesClause - The SQL VALUES clause
   * @returns {Promise<void>}
   */
  updateCombinedReport: async (valuesClause) => {
    if (!valuesClause) {
      logger.warn('No Combined Report data to update');
      return;
    }
    
    await db.replaceTableData('combined_report_by_day', valuesClause);
  }
};
