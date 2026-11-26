import { http } from './client.js';

// filtros: { status, origem, mesaId, data, pago }
export const listarPedidos = (filtros) => http.get('/pedidos', filtros);
// { mesaId, itens: [{ produtoId, quantidade }], observacao? }. Quem lança é o garçom.
export const lancarPedido = (dados) => http.post('/pedidos', dados);
// status: 'em_preparo' | 'entregue'
export const avancarPedido = (id, status) => http.patch(`/pedidos/${id}/status`, { status });
export const cancelarPedido = (id) => http.patch(`/pedidos/${id}/cancelar`);
export const registrarPagamento = (id, formaPagamento) => http.post(`/pedidos/${id}/pagamento`, { formaPagamento });
