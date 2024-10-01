import pool from './connections/PSQL.js'

async function command(values) {
  try {
    const deleteAll = await pool.query('DELETE FROM "DolarAbril"')
    const result = await pool.query(`INSERT INTO "DolarAbril" (fecha, dolar)
     ${values}`)
    console.log(result.rows)
  } catch (error) {
    console.log(error)
  }
}

export default command
