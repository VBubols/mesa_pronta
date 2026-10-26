import { http } from './client.js';

// Resumo: { criadas, atualizadas, inalteradas, inativadas, descartadas, skillsNaoEncontradas, erros, ... }
export const sincronizarVagas = () => http.post('/admin/vagas/sincronizar');

// Usuários
export const listarUsuarios = (filtros) => http.get('/admin/usuarios', filtros);
export const desativarUsuario = (id) => http.patch(`/admin/usuarios/${id}/desativar`);
export const reativarUsuario = (id) => http.patch(`/admin/usuarios/${id}/reativar`);

// Vagas (internas e do GitHub). filtros: { busca, origem, ativa, oculta, pagina, limite }
// Resposta: { dados: [vaga com ativa e oculta], paginacao }
export const listarVagasAdmin = (filtros) => http.get('/admin/vagas', filtros);

// dados: { titulo, empresa, descricao, link, nivel, modalidade, contratacao, stack, cidade, uf, skills: [ids] }
// UF obrigatória quando a vaga não é remota. Devolve a vaga no mesmo formato do detalhe.
export const criarVagaInterna = (dados) => http.post('/admin/vagas', dados);
export const editarVagaInterna = (id, dados) => http.put(`/admin/vagas/${id}`, dados);
export const removerVagaInterna = (id) => http.delete(`/admin/vagas/${id}`);

// Valem para qualquer vaga. Vaga do GitHub não se edita nem se remove: só se oculta.
export const ocultarVaga = (id) => http.patch(`/admin/vagas/${id}/ocultar`);
export const reexibirVaga = (id) => http.patch(`/admin/vagas/${id}/reexibir`);
