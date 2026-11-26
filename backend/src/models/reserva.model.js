import sequelize from '../config/database.js';
import { DataTypes, Op } from 'sequelize';
import { STATUS_RESERVA } from '../constants/restaurante.js';

export const Reserva = sequelize.define(
  'Reserva',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    horario: { type: DataTypes.STRING(5), allowNull: false },
    pessoas: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUS_RESERVA), allowNull: false, defaultValue: 'confirmada' },
    observacao: { type: DataTypes.STRING(255), allowNull: true },
    // clienteId, mesaId e garcomId vêm das associações (models/index.js).
    // garcomId é definido no check-in e recebe os 10% dos pedidos antecipados da reserva.
  },
  {
    tableName: 'reserva',
    timestamps: true,
    indexes: [
      // Uma reserva ativa por mesa, data e horário. O banco garante, mesmo com dois
      // pedidos simultâneos; a cancelada libera a mesa (índice parcial).
      {
        name: 'reserva_mesa_data_horario_ativa',
        unique: true,
        fields: ['mesaId', 'data', 'horario'],
        where: { status: { [Op.ne]: 'cancelada' } },
      },
    ],
  },
);

export default Reserva;
