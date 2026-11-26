import * as financeiroService from '../services/financeiro.service.js';

export async function listarCompras(req, res) {
    return res.status(200).json(await financeiroService.listarCompras(req.validado.query));
}

export async function criarCompra(req, res) {
    return res.status(201).json(await financeiroService.criarCompra(req.usuario.id, req.body));
}

export async function atualizarCompra(req, res) {
    return res.status(200).json(await financeiroService.atualizarCompra(req.params.id, req.body));
}

export async function removerCompra(req, res) {
    await financeiroService.removerCompra(req.params.id);
    return res.status(204).end();
}

export async function resumo(req, res) {
    return res.status(200).json(await financeiroService.resumo(req.validado.query));
}
