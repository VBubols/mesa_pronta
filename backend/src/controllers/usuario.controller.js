import * as usuarioService from '../services/usuario.service.js';

// No Express 5, erros lançados em handlers async já chegam ao middleware de
// erros, então não há try/catch aqui. Toda a regra de negócio (e-mail e CPF
// repetidos, hash da senha, serialização com CPF) fica em usuario.service.js.

export async function perfil(req, res) {
    return res.status(200).json(await usuarioService.obterPerfil(req.usuario.id));
}

export async function atualizarPerfil(req, res) {
    return res.status(200).json(await usuarioService.atualizarPerfil(req.usuario.id, req.body));
}

export async function atualizarSenha(req, res) {
    await usuarioService.atualizarSenha(req.usuario.id, req.body);
    return res.status(204).send();
}

export async function desativarConta(req, res) {
    await usuarioService.desativarConta(req.usuario.id);
    return res.status(204).send();
}
