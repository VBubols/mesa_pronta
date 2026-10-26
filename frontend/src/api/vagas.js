import { http } from './client.js';

// filtros: { q, nivel, modalidade, stack, pagina, limite }. nivel, modalidade e stack aceitam lista.
// Resposta: { dados: [vaga], paginacao: { pagina, limite, total, totalPaginas } }
export const listarVagas = (filtros) => http.get('/vagas', filtros);

// Mesmos filtros e formato. 404 se o usuário ainda não tem currículo.
export const listarRecomendadas = (filtros) => http.get('/vagas/recomendadas', filtros);

// { vaga, match } -> match é null se o usuário não tem currículo.
export const obterVaga = (id) => http.get(`/vagas/${id}`);
