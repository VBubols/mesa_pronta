import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

// Compra de alimentos e insumos: a despesa do controle financeiro.
export const Compra = sequelize.define(
  'Compra',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    descricao: { type: DataTypes.STRING(200), allowNull: false },
    fornecedor: { type: DataTypes.STRING(100), allowNull: true },
    valorCentavos: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    // registradoPorId vem da associação (models/index.js)
  },
  { tableName: 'compra', timestamps: true },
);

export default Compra;
