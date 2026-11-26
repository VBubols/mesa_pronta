import { http } from './client.js';

// filtros: { busca, role, pagina, limite } -> { dados, total, pagina, limite }
export const listarUsuarios = (filtros) => http.get('/admin/usuarios', filtros);
// dados: { nome, sobrenome, email, senha, telefoneCelular?, role: 'funcionario' | 'admin' }
export const criarUsuario = (dados) => http.post('/admin/usuarios', dados);
export const desativarUsuario = (id) => http.patch(`/admin/usuarios/${id}/desativar`);
export const reativarUsuario = (id) => http.patch(`/admin/usuarios/${id}/reativar`);
