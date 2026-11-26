import { http } from './client.js';

// Público: só o que está disponível
export const listarCardapio = (filtros) => http.get('/cardapio', filtros);

// Gestão (admin). Preços sempre em centavos.
export const listarProdutos = (filtros) => http.get('/produtos', filtros);
export const criarProduto = (dados) => http.post('/produtos', dados);
export const atualizarProduto = (id, dados) => http.patch(`/produtos/${id}`, dados);

// Mesas: funcionário lista; admin cadastra e edita
export const listarMesas = (filtros) => http.get('/mesas', filtros);
export const criarMesa = (dados) => http.post('/mesas', dados);
export const atualizarMesa = (id, dados) => http.patch(`/mesas/${id}`, dados);
