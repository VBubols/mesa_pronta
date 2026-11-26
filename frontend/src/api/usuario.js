import { http } from './client.js';

// Perfil do próprio usuário
export const obterPerfil = () => http.get('/usuario/perfil');
export const atualizarPerfil = (dados) => http.patch('/usuario/perfil', dados);
export const atualizarSenha = (dados) => http.patch('/usuario/senha', dados);
