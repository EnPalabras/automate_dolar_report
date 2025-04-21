// src/jobs/daily-jobs.js
import { getRows } from '../connections/GoogleAPI.js';
import pool from '../connections/PSQL.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Actualiza el valor del dólar en la base de datos
 */
export const updateDolarJob = async () => {
  logger.start('Dolar Update');
  try {
    const response = await getRows('Dolar!P3:Q', process.env.GOOGLE_SPREADSHEET_ID_DOLAR);
    const data = response.data.values;

    let consulta = ' VALUES ';
    let valores = data
      .map((fila) => {
        return `(${fila
          .map((valor, index) => {
            if (index === 0) {
              return `'${valor}'`;
            }
            if (index === 1) {
              if (valor.trim() === '') {
                return 0; // Reemplazamos por 0 si está vacío
              } else if (!isNaN(parseFloat(valor))) {
                return valor; // Dejamos el valor como número (incluye decimales)
              }
            }
          })
          .join(', ')})`;
      })
      .join(', \n');

    consulta += valores;

    // Eliminar todos los registros de la tabla DolarAbril
    await pool.query('DELETE FROM "DolarAbril"');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO "DolarAbril" (fecha, dolar) ${consulta}`);
    
    logger.success('Dolar data updated successfully');
  } catch (error) {
    logger.error('Failed to update Dolar data', error);
  }
  logger.end('Dolar Update');
};

/**
 * Actualiza la tabla combined_report_by_day en la base de datos
 */
export const updateCombinedReportJob = async () => {
  logger.start('Combined Report Update');
  try {
    const CAMPAIGN_REPORT_ID = process.env.GOOGLE_SPREADSHEET_PAID_CHANNELS_REPORT || config.google.spreadsheets.paidChannels;
    
    // Ajustado para coincidir con tus datos: fecha, campaña, canal, impresiones, clics, gasto, ingresos, eventos clave
    const response = await getRows('Combined by Day!A2:H', CAMPAIGN_REPORT_ID);
    const data = response.data.values;

    if (!data || data.length === 0) {
      logger.warn('No Combined Report data to update');
      return;
    }
    
    let valuesClause = 'VALUES ';
    
    const valores = data.map((row) => {
      return `(${row.map((value, index) => {
        // Para fecha, nombre de campaña y canal (primeras 3 columnas) - formato como strings
        if (index <= 2) {
          return `'${value.replace(/'/g, "''")}'`;
        }
        // Para valores numéricos
        if (value === undefined || value === null || value.trim() === '') {
          return 'NULL';
        } else if (!isNaN(parseFloat(value))) {
          // Convertir valores numéricos, reemplazando comas por puntos si es necesario
          return parseFloat(value.replace(/,/g, '.'));
        } else {
          return `'${value.replace(/'/g, "''")}'`;
        }
      }).join(', ')})`;
    }).join(',\n');
    
    valuesClause += valores;
    
    // Eliminar todos los registros de la tabla combined_report_by_day
    await pool.query('DELETE FROM combined_report_by_day');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO combined_report_by_day (date, campaign_name, channel, impressions, clicks, spend, total_revenue, keyevents) ${valuesClause}`);
    
    logger.success('Combined Report data updated successfully');
  } catch (error) {
    logger.error('Failed to update Combined Report data', error);
  }
  logger.end('Combined Report Update');
};

/**
 * Actualiza la tabla google_users_by_day en la base de datos
 */
export const updateGoogleUsersByDayJob = async () => {
  logger.start('Google Users By Day Update');
  try {
    const GOOGLE_REPORT_ID = process.env.GOOGLE_SPREADSHEET_GOOGLE_REPORT_ID || config.google.spreadsheets.google;
    
    // Obtener datos de la hoja "Users & CR!A2:H"
    const response = await getRows('Users & CR!A2:H', GOOGLE_REPORT_ID);
    const data = response.data.values;

    if (!data || data.length === 0) {
      logger.warn('No Google Users data to update');
      return;
    }
    
    let valuesClause = 'VALUES ';
    
    const valores = data.map((row) => {
      return `(${row.map((value, index) => {
        // Para la fecha (primera columna) - formatear como string
        if (index === 0) {
          return `'${value.replace(/'/g, "''")}'`;
        }
        // Para valores numéricos (todas las demás columnas)
        if (value === undefined || value === null || value.trim() === '') {
          return 'NULL';
        } else if (!isNaN(parseFloat(value))) {
          // Convertir valores numéricos, reemplazando comas por puntos si es necesario
          return parseFloat(value.replace(/,/g, '.'));
        } else {
          return `'${value.replace(/'/g, "''")}'`;
        }
      }).join(', ')})`;
    }).join(',\n');
    
    valuesClause += valores;
    
    // Eliminar todos los registros de la tabla google_users_by_day
    await pool.query('DELETE FROM google_users_by_day');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO google_users_by_day (date, sessions, totalusers, newusers, engagedsessions, addtocarts, checkouts, ecommercepurchases) ${valuesClause}`);
    
    logger.success('Google Users By Day data updated successfully');
  } catch (error) {
    logger.error('Failed to update Google Users By Day data', error);
  }
  logger.end('Google Users By Day Update');
};

/**
 * Ejecuta todas las tareas diarias
 */
export const runAllDailyJobs = async () => {
  try {
    await updateDolarJob();
    await updateCombinedReportJob();
    await updateGoogleUsersByDayJob(); // Agregar esta línea
    logger.success('All daily jobs completed successfully');
  } catch (error) {
    logger.error('Error running daily jobs', error);
    throw error;
  }
};