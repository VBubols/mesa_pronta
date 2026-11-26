import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

// Mesas não são apagadas (têm reservas e pedidos ligados): o admin desativa.
export const Mesa = sequelize.define(
  'Mesa',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    numero: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    capacidade: { type: DataTypes.INTEGER, allowNull: false },
    ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'mesa', timestamps: true },
);

export default Mesa;
