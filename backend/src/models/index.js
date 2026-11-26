// Importar este arquivo registra todos os models e suas associações.
// (as associações ficam aqui para evitar import circular entre os models)
import Usuario from './usuario.model.js';
import Mesa from './mesa.model.js';
import Produto from './produto.model.js';
import Reserva from './reserva.model.js';

// Mesas, produtos e usuários nunca são apagados (são desativados), então as
// chaves estrangeiras usam RESTRICT: o banco impede apagar algo que tem histórico.
const restrito = { onDelete: 'RESTRICT', onUpdate: 'CASCADE' };

// Reserva
Reserva.belongsTo(Usuario, { foreignKey: { name: 'clienteId', allowNull: false }, as: 'cliente', ...restrito });
Reserva.belongsTo(Mesa, { foreignKey: { name: 'mesaId', allowNull: false }, as: 'mesa', ...restrito });
Reserva.belongsTo(Usuario, { foreignKey: { name: 'garcomId', allowNull: true }, as: 'garcom', ...restrito });

export { Usuario, Mesa, Produto, Reserva };
