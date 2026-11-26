import { http } from './client.js';

// { dias: [{ dia, nome }], horarios: ['19:00', ...] }
export const opcoesReserva = () => http.get('/reservas/opcoes');
// { data, pessoas, horario? } -> [{ horario, mesas: [{ id, numero, capacidade }] }]
export const disponibilidade = (filtros) => http.get('/reservas/disponibilidade', filtros);

// Cliente
export const criarReserva = (dados) => http.post('/reservas', dados);
export const minhasReservas = () => http.get('/reservas/minhas');
// Compra antecipada: { itens: [{ produtoId, quantidade }], formaPagamento, observacao? }
export const comprarAntecipado = (id, dados) => http.post(`/reservas/${id}/pedido`, dados);

// Gestão
export const listarReservas = (filtros) => http.get('/reservas', filtros);
export const checkIn = (id, garcomId) => http.patch(`/reservas/${id}/check-in`, garcomId ? { garcomId } : {});
export const concluirReserva = (id) => http.patch(`/reservas/${id}/concluir`);

// Cliente (as próprias) e gestão (qualquer uma)
export const cancelarReserva = (id) => http.patch(`/reservas/${id}/cancelar`);
