import { getRows } from './connections/GoogleAPI.js'
import pool from './connections/PSQL.js'
import dotenv from 'dotenv'

dotenv.config()

const { GOOGLE_SPREADSHEET_ID_MAYORISTAS } = process.env

const objectKeys = [
  'fecha_compra',
  'id_orden',
  'canal_venta',
  'id_orden_venta',
  'nombre_completo',
  'mail',
  'dni',
  'telefono',
  'producto',
  'cantidad_juegos',
  'ciudad',
  'provincia',
  'pais',
  'tipo_envio',
  'stock',
  'metodo_pago',
  'moneda',
  'precio_unit_prod',
  'precio_total_prod',
  'costo_envio',
  'ingresos_brutos',
  'ingresos_netos',
  'fecha_envio',
  'fecha_pago',
  'fecha_liquidacion',
]
const numericKeys = [
  'Desconectados',
  'Destapados',
  'ANuevo',
  'DesconectadosX2',
  'ComboDescDest',
  'ComboDescAnoNuevo',
  'TotalDesconectados',
  'TotalDestapados',
  'TotalANuevo',
  'CantidadProductos',
  'TotalJuegos',
  'DescuentoTotal',
  'DescuentoCupon',
  'DescuentoMetodoPago',
  'DescuentoCantidad',
  'CostoEnvio',
  'IngresosBrutos',
  'IngresosNetos',
  'RefExterna',
]
const toArrayOfObjects = (keys, values) => {
  return values.map((value) => {
    return keys.reduce((object, key, index) => {
      if (numericKeys.includes(key)) {
        object[key] = parseFloat(value[index].replace(',', '.'))
      } else if (value[index] === '') {
        object[key] = null
      } else {
        object[key] = value[index]
      }
      return object
    }, {})
  })
}

const getOrdersFromGoogle = async () => {
  const response = await getRows(
    'Ventas (Automático)!A100:Y',
    GOOGLE_SPREADSHEET_ID_MAYORISTAS
  )

  const values = response.data.values
  const orders = toArrayOfObjects(objectKeys, values)
  const filteredOrders = orders.filter(
    (order) =>
      order.canal_venta === 'Reventa' || order.canal_venta === 'Empresa'
  )

  return filteredOrders
}

const transformOrders = (orders) => {
  const editedOrders = []

  orders.map((order) => {
    const editedOrder = {}
    if (
      editedOrders.map((listOrders) => listOrders.idEP).includes(order.id_orden)
    ) {
      const editedOrder = editedOrders.find(
        (listOrders) => listOrders.idEP === order.id_orden
      )
      editedOrder['Products'].push({
        producto: order['producto'],
        variante: order['producto'],
        cantidad: parseInt(order['cantidad_juegos']),
        precioUnitario:
          parseFloat(
            order['precio_unit_prod']
              .replace('$', '')
              .replace('.', '')
              .replace(',', '.')
          ) ?? 0,
        precioTotal:
          parseFloat(
            order['precio_total_prod']
              .replace('$', '')
              .replace('.', '')
              .replace(',', '.')
          ) ?? 0,
        moneda: order['moneda'],
      })
    }

    if (
      !editedOrders
        .map((listOrders) => listOrders.idEP)
        .includes(order.id_orden)
    ) {
      const fechaOrden =
        order['hora_compra'] !== null && order['hora_compra'] !== undefined
          ? new Date(
              order['fecha_compra'].split('/')[2],
              order['fecha_compra'].split('/')[1] - 1,
              order['fecha_compra'].split('/')[0],
              order['hora_compra'].split(':')[0] - 3 ?? 0,
              order['hora_compra'].split(':')[1] ?? 0,
              order['hora_compra'].split(':')[2] ?? 0
            )
          : new Date(
              order['fecha_compra'].split('/')[2],
              order['fecha_compra'].split('/')[1] - 1,
              order['fecha_compra'].split('/')[0]
            )

      editedOrder['idEP'] = order['id_orden']
      editedOrder['estado'] = order['estado_orden']
        ? order['estado_orden']
        : 'Finalizada'
      editedOrder['fechaCreada'] = fechaOrden
      editedOrder['canalVenta'] = order['canal_venta']
      editedOrder['nombre'] = order['nombre_completo']
      editedOrder['mail'] = order['mail']
      editedOrder['DNI'] = order['dni']
      editedOrder['telefono'] = order['telefono']
      editedOrder['cuponPago'] = order['cupon_dcto']
      editedOrder['externalId'] = order['id_ref_extra']
      editedOrder['montoTotal'] =
        parseFloat(
          order['ingresos_brutos']
            .replace('$', '')
            .replaceAll('.', '')
            .replace(',', '.')
        ) ?? 0
      editedOrder['Products'] = []
      editedOrder['Products'].push({
        producto: order['producto'],
        variante: order['producto'],
        cantidad: parseInt(order['cantidad_juegos']),
        precioUnitario:
          parseFloat(
            order['precio_unit_prod']
              .replace('$', '')
              .replaceAll('.', '')
              .replace(',', '.')
          ) ?? 0,
        precioTotal:
          parseFloat(
            order['precio_total_prod']
              .replace('$', '')
              .replaceAll('.', '')
              .replace(',', '.')
          ) ?? 0,
        moneda: order['moneda'],
      })
      editedOrder['Shipment'] = []

      editedOrder['Shipment'].push({
        estado: order['fecha_envio'] !== null ? 'Enviado' : 'Pendiente',
        fechaEnvio:
          order['fecha_envio'] !== null && order['fecha_envio'] !== undefined
            ? new Date(
                order['fecha_envio'].split('/')[2],
                order['fecha_envio'].split('/')[1] - 1,
                order['fecha_envio'].split('/')[0]
              )
            : null,
        fechaEntrega:
          order['fecha_envio'] !== null && order['fecha_envio'] !== undefined
            ? new Date(
                order['fecha_envio'].split('/')[2],
                order['fecha_envio'].split('/')[1] - 1,
                order['fecha_envio'].split('/')[0]
              )
            : null,
        tipoEnvio: order['tipo_envio'],
        shipCost: order['costo_envio']
          ? parseFloat(
              order['costo_envio']
                .replace('$', '')
                .replaceAll('.', '')
                .replace(',', '.')
            )
          : 0,

        nombreEnvio: order['tipo_envio'],
        codigoPostal: order['zip_code'],
        ciudad: order['ciudad'],
        provincia: order['provincia'],
        pais: order['pais'],
        stockDesde: order['stock'],
      })

      editedOrder['Payments'] = []

      editedOrder['Payments'].push({
        // idEP: order['id_orden'],
        estado: order['fecha_pago'] !== null ? 'Pagado' : 'Pendiente',
        fechaPago:
          order['fecha_pago'] !== null
            ? new Date(
                order['fecha_pago'].split('/')[2],
                order['fecha_pago'].split('/')[1] - 1,
                order['fecha_pago'].split('/')[0]
              )
            : null,
        tipoPago: order['pagoEdit'],
        cuentaDestino: order['metodo_pago'],
        fechaLiquidacion:
          order['fecha_liquidacion'] !== null
            ? new Date(
                order['fecha_liquidacion'].split('/')[2],
                order['fecha_liquidacion'].split('/')[1] - 1,
                order['fecha_liquidacion'].split('/')[0]
              )
            : null,
        montoTotal:
          parseFloat(
            order['ingresos_brutos']
              .replace('$', '')
              .replaceAll('.', '')
              .replace(',', '.')
          ) ?? 0,
        montoRecibido:
          parseFloat(
            order['ingresos_netos']
              .replace('$', '')
              .replaceAll('.', '')
              .replace(',', '.')
          ) ?? 0,
        gatewayId: null,
        cuotas: parseInt(order['cuotas']),
        moneda: order['moneda'],
      })
      editedOrder['Discounts'] = []

      editedOrders.push(editedOrder)
    }
  })

  return editedOrders
}

const mainMayoristas = async () => {
  const orders = await getOrdersFromGoogle()
  const allOrders = transformOrders(orders)

  return allOrders
}

async function GetMayoristasIDs() {
  try {
    const result = await pool.query(
      `SELECT "idEP" FROM "Orders" WHERE "channel" = 'mayoristas' OR "channel" = 'reventa'`
    )
    const mappedIds = result.rows.map((sales) => sales.idEP)

    return mappedIds
  } catch (error) {
    console.log(error)
  }
}

const filterSales = async () => {
  const sales = await mainMayoristas()
  const uploades_sales = await GetMayoristasIDs()
  const filteredSales = sales.filter(
    (venta) => !uploades_sales.includes(venta.idEP)
  )

  return filteredSales
}

const uploadSales = async () => {
  const sales = await filterSales()

  for (let i = 0; i < sales.length; i++) {
    console.log(sales[i].idEP)
    const res = await fetch('https://systemep.vercel.app/api/sales/others', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sales[i]),
    })
    const data = await res.json()

    console.log(data)

    if (!res.ok) {
      failedOrders.push(sales[i].idEP)
    }

    if (data.code === 500) {
      failedOrders.push(sales[i].idEP)
    }
  }
}

await uploadSales()
