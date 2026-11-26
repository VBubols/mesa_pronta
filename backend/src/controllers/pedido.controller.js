import * as pedidoService from '../services/pedido.service.js';

export async function criarLocal(req, res) {
    return res.status(201).json(await pedidoService.criarLocal(req.usuario, req.body));
}

export async function criarAntecipado(req, res) {
    return res.status(201).json(await pedidoService.criarAntecipado(req.usuario.id, req.params.id, req.body));
}

export async function listar(req, res) {
    return res.status(200).json(await pedidoService.listar(req.validado.query));
}

export async function obter(req, res) {
    return res.status(200).json(await pedidoService.obter(req.params.id, req.usuario));
}

export async function avancarStatus(req, res) {
    return res.status(200).json(await pedidoService.avancarStatus(req.params.id, req.body));
}

export async function cancelar(req, res) {
    return res.status(200).json(await pedidoService.cancelar(req.params.id));
}

export async function pagar(req, res) {
    return res.status(200).json(await pedidoService.pagar(req.params.id, req.body));
}
