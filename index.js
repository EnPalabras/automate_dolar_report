import { getRows } from './src/connections/GoogleAPI.js'
import command from './src/PostgreSQL.js'

async function GetDolarCommand() {
  const response = await getRows('Dolar!P3:Q')

  const data = response.data.values

  let consulta = ' VALUES '

  let valores = data
    .map((fila) => {
      return `(${fila
        .map((valor, index) => {
          if (index === 0) {
            return `'${valor}'`
          }
          if (index === 1) {
            if (valor.trim() === '') {
              return 0 // Reemplazamos por 0 si está vacío
            } else if (!isNaN(parseFloat(valor))) {
              return valor // Dejamos el valor como número (incluye decimales)
            }
          }
        })
        .join(', ')})`
    })
    .join(', \n')

  consulta += valores

  return consulta
}

async function main() {
  const values_data = await GetDolarCommand()
  const update = await command(values_data)
  console.log(values_data)

  return update
}

await main()
