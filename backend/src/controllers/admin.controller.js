import * as adminService from '../services/admin.service.js';

export async function listarUsuarios(req, res) {
    return res.status(200).json(await adminService.listarUsuarios(req.validado.query));
}

export async function criarUsuario(req, res) {
    return res.status(201).json(await adminService.criarUsuario(req.body));
}

export async function desativarUsuario(req, res) {
    const usuario = await adminService.alterarStatus(req.params.id, false, req.usuario.id);
    return res.status(200).json(usuario);
}

export async function reativarUsuario(req, res) {
    const usuario = await adminService.alterarStatus(req.params.id, true, req.usuario.id);
    return res.status(200).json(usuario);
}