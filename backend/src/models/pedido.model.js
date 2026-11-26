import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import { FORMAS_PAGAMENTO, ORIGENS_PEDIDO, STATUS_PEDIDO } from '../constants/restaurante.js';

// Os valores são calculados pelo backend a partir do cardápio e gravados no pedido,
// para que mudar um preço depois não altere pedidos antigos nem o financeiro.
export const Pedido = sequelize.define(
  'Pedido',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    origem: { type: DataTypes.ENUM(...ORIGENS_PEDIDO), allowNull: false },
    status: { type: DataTypes.ENUM(...STATUS_PEDIDO), allowNull: false },
    subtotalCentavos: { type: DataTypes.INTEGER, allowNull: false },
    taxaServicoCentavos: { type: DataTypes.INTEGER, allowNull: false },
    totalCentavos: { type: DataTypes.INTEGER, allowNull: false },
    formaPagamento: { type: DataTypes.ENUM(...FORMAS_PAGAMENTO), allowNull: true },
    // Pago = pagoEm preenchido. O financeiro usa essa data.
    pagoEm: { type: DataTypes.DATE, allowNull: true },
    // Calculado (não vira coluna): aparece no JSON para o front não precisar deduzir
    pago: {
      type: DataTypes.VIRTUAL,
      get() { return this.getDataValue('pagoEm') != null; },
    },
    observacao: { type: DataTypes.STRING(255), allowNull: true },
    // mesaId, reservaId, clienteId e garcomId vêm das associações (models/index.js).
  },
  { tableName: 'pedido', timestamps: true },
);

export const ItemPedido = sequelize.define(
  'ItemPedido',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    // Cópias do produto no momento do pedido
    nomeProduto: { type: DataTypes.STRING(100), allowNull: false },
    precoUnitarioCentavos: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'item_pedido', timestamps: false },
);

export default Pedido;
