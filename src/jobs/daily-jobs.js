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
 * Actualiza la tabla users_cr_by_channel en la base de datos
 */
export const updateUsersCRByChannelJob = async () => {
  logger.start('Users CR by Channel Update');
  try {
    const GOOGLE_REPORT_ID = process.env.GOOGLE_SPREADSHEET_GOOGLE_REPORT_ID || config.google.spreadsheets.google;
    
    // Obtener datos de la hoja "Users & CR by Channel!A2:L"
    const response = await getRows('Users & CR by Channel!A2:L', GOOGLE_REPORT_ID);
    const data = response.data.values;

    if (!data || data.length === 0) {
      logger.warn('No Users CR by Channel data to update');
      return;
    }
    
    let valuesClause = 'VALUES ';
    
    const valores = data.map((row) => {
      // Asegurarse de que todos los rows tengan la misma longitud
      // Si no tiene la columna total_revenue, añadir un 0
      const paddedRow = [...row];
      if (paddedRow.length < 12) {
        paddedRow.push('0'); // Añadir total_revenue=0 si no existe
      }
      
      return `(${paddedRow.map((value, index) => {
        // Para la fecha (primera columna) y primary_channel_group (segunda columna) - formatear como strings
        if (index <= 1) {
          if (value === undefined || value === null || value.trim() === '') {
            return "'(not set)'";
          }
          return `'${value.replace(/'/g, "''")}'`;
        }
        // Para valores numéricos (resto de columnas)
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
    
    
    // Eliminar todos los registros de la tabla users_cr_by_channel
    await pool.query('DELETE FROM users_cr_by_channel');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO users_cr_by_channel (date, primary_channel_group, sessions, engaged_sessions, total_users, new_users, add_to_carts, checkouts, key_events, ecommerce_purchases, total_revenue, cr) ${valuesClause}`);
    
    logger.success('Users CR by Channel data updated successfully');
  } catch (error) {
    logger.error('Failed to update Users CR by Channel data', error);
  }
  logger.end('Users CR by Channel Update');
};


/**
 * Actualiza la tabla ads_campaign_performance en la base de datos
 */
export const updateAdsCampaignPerformanceJob = async () => {
  logger.start('Ads Campaign Performance Update');
  try {
    const GOOGLE_REPORT_ID = process.env.GOOGLE_SPREADSHEET_GOOGLE_REPORT_ID || config.google.spreadsheets.google;
    
    // Obtener datos de la hoja "Probando Ads!A2:I"
    const response = await getRows('Probando Ads!A2:I', GOOGLE_REPORT_ID);
    const data = response.data.values;

    if (!data || data.length === 0) {
      logger.warn('No Ads Campaign Performance data to update');
      return;
    }
    
    let valuesClause = 'VALUES ';
    
    const valores = data.map((row) => {
      return `(${row.map((value, index) => {
        // Formatear fecha, nombre de campaña y contenido del anuncio como strings
        if (index <= 2) {
          if (value === undefined || value === null || value.trim() === '') {
            return "'(not set)'";
          }
          return `'${value.replace(/'/g, "''")}'`;
        }
        // Para sesiones, usuarios totales y eventos clave (índices 3, 4, 7)
        else if (index === 3 || index === 4 || index === 7) {
          if (value === undefined || value === null || value.trim() === '') {
            return 0;
          }
          return parseInt(value) || 0;
        }
        // Para tasas (bounce_rate y engagement_rate) (índices 5, 6)
        else if (index === 5 || index === 6) {
          if (value === undefined || value === null || value.trim() === '') {
            return 0;
          }
          return parseFloat(value) || 0;
        }
        // Para total_revenue (índice 8)
        else if (index === 8) {
          if (value === undefined || value === null || value.trim() === '') {
            return 0;
          }
          return parseFloat(value) || 0;
        }
      }).join(', ')})`;
    }).join(',\n');
    
    valuesClause += valores;
    
    // Eliminar todos los registros de la tabla ads_campaign_performance
    await pool.query('DELETE FROM ads_campaign_performance');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO ads_campaign_performance (date, campaign_name, ad_content, sessions, total_users, bounce_rate, engagement_rate, key_events, total_revenue) ${valuesClause}`);
    
    logger.success('Ads Campaign Performance data updated successfully');
  } catch (error) {
    logger.error('Failed to update Ads Campaign Performance data', error);
  }
  logger.end('Ads Campaign Performance Update');
};

/**
 * Actualiza la tabla meli_campaigns_performance en la base de datos
 */
export const updateMeliCampaignsJob = async () => {
  logger.start('MeLi Campaigns Update');
  try {
    // Usar la variable de entorno o el valor del config
    const MELI_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID_MELI || config.google.spreadsheets.meli;
    
    // Obtener datos de la hoja "Meli Campaigns!A2:U" - ajusta el rango según tu hoja real
    const response = await getRows('Campaigns 2V!A2:U', MELI_SPREADSHEET_ID);
    const data = response.data.values;

    if (!data || data.length === 0) {
      logger.warn('No MeLi Campaigns data to update');
      return;
    }
    
    let valuesClause = 'VALUES ';
    
    const valores = data.map((row) => {
      return `(${row.map((value, index) => {
        // Campos de texto: ad_id, date, ad_name, status, strategy (índices 0-4)
        if (index <= 4) {
          if (value === undefined || value === null || value.trim() === '') {
            return 'NULL';
          }
          return `'${value.replace(/'/g, "''")}'`;
        }
        // Para los demás campos numéricos
        else {
          if (value === undefined || value === null || value.trim() === '') {
            return 0;
          }
          // Si hay valores con comas, reemplazarlas por puntos
          if (typeof value === 'string' && value.includes(',')) {
            return parseFloat(value.replace(/,/g, '.')) || 0;
          }
          return parseFloat(value) || 0;
        }
      }).join(', ')})`;
    }).join(',\n');
    
    valuesClause += valores;
    
    // Eliminar todos los registros de la tabla meli_campaigns_performance
    await pool.query('DELETE FROM meli_campaigns');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO meli_campaigns (
      ad_id, 
      date, 
      ad_name, 
      status, 
      strategy, 
      budget, 
      clicks, 
      impressions, 
      cost_meli, 
      ctr, 
      cpc, 
      cpm, 
      acos_target, 
      acos, 
      roas, 
      sov, 
      amount_direct, 
      amount_indirect, 
      amount_total, 
      direct_items_quantity, 
      organic_items_quantity
    ) ${valuesClause}`);
    
    logger.success('MeLi Campaigns data updated successfully');
  } catch (error) {
    logger.error('Failed to update MeLi Campaigns data', error);
  }
  logger.end('MeLi Campaigns Update');
};

/**
 * Actualiza los datos de mappings de anuncios
 */
export const updateAdsMappingJob = async () => {
  logger.start('Ads Mapping');
  try {
    // Utilizar la misma variable de entorno o del config
    const MAIN_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || config.google.spreadsheets.main;
    
    // Obtener datos de la hoja "Sheet1!A2:L"
    console.log(MAIN_SPREADSHEET_ID);
    const response = await getRows('Mapping!A2:L', MAIN_SPREADSHEET_ID);
    const data = response.data.values;
    
    if (!data || data.length === 0) {
      logger.warn('No Ads Mapping data to update');
      return;
    }
    
    // Encontrar el número máximo de columnas en los datos
    const maxColumns = 12; // A2:L son 12 columnas
    
    // Asegurar que todas las filas tengan el mismo número de columnas
    const normalizedData = data.map(row => {
      // Si la fila tiene menos columnas que el máximo, rellenar con valores vacíos
      if (row.length < maxColumns) {
        return [...row, ...Array(maxColumns - row.length).fill('')];
      }
      return row;
    });
    
    let valuesClause = 'VALUES ';
    
    const valores = normalizedData.map(row => {
      return `(${row.map(value => {
        // Manejar valores vacíos o nulos
        if (value === undefined || value === null || value.trim() === '') {
          return 'NULL';
        }
        return `'${value.replace(/'/g, "''")}'`;
      }).join(', ')})`;
    }).join(',\n');
    
    valuesClause += valores;
    
    // Eliminar todos los registros de la tabla ads_data
    await pool.query('DELETE FROM ads_data');
    
    // Insertar los nuevos valores
    await pool.query(`INSERT INTO ads_data (
      campaign_name,
      campaign_id,
      ad_group_name,
      ad_group_id,
      ad_name,
      ad_id,
      content_type,
      channel,
      subchannel,
      campaign_type,
      platform,
      target_product
    ) ${valuesClause}`);
    
    logger.success('Ads Mapping data updated successfully');
  } catch (error) {
    logger.error('Failed to update Ads Mapping data', error);
  }
  logger.end('Ads Mapping');
};

/**
 * Ejecuta todas las tareas diarias
 */
export const runAllDailyJobs = async () => {
  try {
    await updateDolarJob();
    await updateCombinedReportJob();
    await updateGoogleUsersByDayJob();
    await updateUsersCRByChannelJob(); 
    await updateAdsCampaignPerformanceJob();
    await updateMeliCampaignsJob(); // Nueva tarea para MeLi Campaigns
    await updateAdsMappingJob();
    logger.success('All daily jobs completed successfully');
  } catch (error) {
    logger.error('Error running daily jobs', error);
    throw error;
  }
};

