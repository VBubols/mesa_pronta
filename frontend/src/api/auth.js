import { http } from './client.js';

// { token, usuario: { id, nome, sobrenome, email, role, ... } }
export const login = (email, senha) => http.post('/auth/login', { email, senha });

// Campos: nome, sobrenome, email, senha, cpf, telefoneCelular, telefoneFixo (opcional),
// dataNascimento (AAAA-MM-DD) e paisOrigem. Ver POST /auth/cadastro no /docs.
export const cadastrar = (dados) => http.post('/auth/cadastro', dados);

// O perfil fica em api/usuario.js.
export { obterPerfil } from './usuario.js';
