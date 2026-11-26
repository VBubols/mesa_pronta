// Importar este arquivo registra todos os models e suas associações.
// (as associações ficam aqui para evitar import circular entre os models)
import Usuario from './usuario.model.js';
import Mesa from './mesa.model.js';
import Produto from './produto.model.js';
import Reserva from './reserva.model.js';
import { Pedido, ItemPedido } from './pedido.model.js';

// Mesas, produtos e usuários nunca são apagados (são desativados), então as
// chaves estrangeiras usam RESTRICT: o banco impede apagar algo que tem histórico.
const restrito = { onDelete: 'RESTRICT', onUpdate: 'CASCADE' };

// Reserva
Reserva.belongsTo(Usuario, { foreignKey: { name: 'clienteId', allowNull: false }, as: 'cliente', ...restrito });
Reserva.belongsTo(Mesa, { foreignKey: { name: 'mesaId', allowNull: false }, as: 'mesa', ...restrito });
Reserva.belongsTo(Usuario, { foreignKey: { name: 'garcomId', allowNull: true }, as: 'garcom', ...restrito });
Reserva.hasMany(Pedido, { foreignKey: 'reservaId', as: 'pedidos' });

// Pedido
Pedido.belongsTo(Mesa, { foreignKey: { name: 'mesaId', allowNull: false }, as: 'mesa', ...restrito });
Pedido.belongsTo(Reserva, { foreignKey: { name: 'reservaId', allowNull: true }, as: 'reserva', ...restrito });
Pedido.belongsTo(Usuario, { foreignKey: { name: 'clienteId', allowNull: true }, as: 'cliente', ...restrito });
Pedido.belongsTo(Usuario, { foreignKey: { name: 'garcomId', allowNull: true }, as: 'garcom', ...restrito });

// Itens: somem junto com o pedido
Pedido.hasMany(ItemPedido, { foreignKey: { name: 'pedidoId', allowNull: false }, as: 'itens', onDelete: 'CASCADE' });
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedidoId' });
ItemPedido.belongsTo(Produto, { foreignKey: { name: 'produtoId', allowNull: false }, as: 'produto', ...restrito });

export { Usuario, Mesa, Produto, Reserva, Pedido, ItemPedido };
