import * as adminService from '../services/admin.service.js';

export async function listarUsuarios(req, res) {
    const { pagina, limite, busca } = req.query;
    return res.status(200).json(await adminService.listarUsuarios({ pagina, limite, busca }));
}

export async function desativarUsuario(req, res) {
    const usuario = await adminService.alterarStatus(req.params.id, false, req.usuario.id);
    return res.status(200).json(usuario);
}

export async function reativarUsuario(req, res) {
    const usuario = await adminService.alterarStatus(req.params.id, true, req.usuario.id);
    return res.status(200).json(usuario);
}