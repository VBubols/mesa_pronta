import { http } from './client.js';

// periodo: { inicio, fim } em AAAA-MM-DD. Sem período, o mês atual.
export const listarCompras = (periodo) => http.get('/compras', periodo);
export const criarCompra = (dados) => http.post('/compras', dados);
export const atualizarCompra = (id, dados) => http.patch(`/compras/${id}`, dados);
export const removerCompra = (id) => http.delete(`/compras/${id}`);

export const resumoFinanceiro = (periodo) => http.get('/financeiro/resumo', periodo);
