import { http } from './client.js';

// { token, usuario: { id, nome, sobrenome, email, role, ... } }
export const login = (email, senha) => http.post('/auth/login', { email, senha });

// Cadastro público, sempre como cliente: nome, sobrenome, email, senha, telefoneCelular.
export const cadastrar = (dados) => http.post('/auth/cadastro', dados);

// O perfil fica em api/usuario.js.
export { obterPerfil } from './usuario.js';
