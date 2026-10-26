import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import {
  cifrar,
  decifrar,
  hashDeterministico,
} from '../utils/cripto.js';

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
    role: {
      type: DataTypes.ENUM('admin', 'usuario'),
      allowNull: false,
      defaultValue: 'usuario',
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    // CPF armazenado cifrado e com hash determinístico.
    cpfCriptografado: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    cpfHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },

    // Atributo virtual para leitura e escrita do CPF.
    cpf: {
      type: DataTypes.VIRTUAL,

      get() {
        const cifrado = this.getDataValue('cpfCriptografado');

        return cifrado ? decifrar(cifrado) : null;
      },

      set(valor) {
        if (valor == null) {
          this.setDataValue('cpfCriptografado', null);
          this.setDataValue('cpfHash', null);

          return;
        }

        this.setDataValue('cpfCriptografado', cifrar(valor));
        this.setDataValue('cpfHash', hashDeterministico(valor));
      },
    },

    // Telefone celular: DDD + 9 dígitos.
    telefoneCelular: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },

    // Telefone fixo: DDD + 8 dígitos.
    telefoneFixo: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    // Data no formato AAAA-MM-DD.
    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Código do país: ISO 3166-1 alpha-2.
    paisOrigem: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
  },
  {
    tableName: 'usuario',
    timestamps: true,
  },
);

// Busca de usuário pelo hash do CPF.
Usuario.buscarPorCpf = (cpf) =>
  Usuario.findOne({
    where: {
      cpfHash: hashDeterministico(cpf),
    },
  });

export default Usuario;