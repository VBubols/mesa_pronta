import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import { ROLES } from '../constants/roles.js';

export const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    sobrenome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // RBAC: controle de acesso baseado em papéis.
    // O cadastro público sempre cria cliente; funcionário e admin são criados pelo admin.
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'cliente',
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    // Telefone celular: DDD + 9 dígitos. Contato do cliente para as reservas.
    telefoneCelular: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },
  },
  {
    tableName: 'usuario',
    timestamps: true,
  },
);

export default Usuario;
