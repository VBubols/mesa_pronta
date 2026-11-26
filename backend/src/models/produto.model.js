import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import { CATEGORIAS_PRODUTO } from '../constants/restaurante.js';

// Item do cardápio. Não é apagado (pedidos antigos apontam para ele): o admin marca indisponível.
export const Produto = sequelize.define(
  'Produto',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    descricao: { type: DataTypes.STRING(500), allowNull: true },
    categoria: { type: DataTypes.ENUM(...CATEGORIAS_PRODUTO), allowNull: false },
    // Dinheiro sempre em centavos: R$ 34,90 = 3490
    precoCentavos: { type: DataTypes.INTEGER, allowNull: false },
    disponivel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'produto', timestamps: true },
);

export default Produto;
