import * as cardapioService from '../services/cardapio.service.js';

export async function listarCardapio(req, res) {
    return res.status(200).json(await cardapioService.listarCardapio(req.validado.query));
}

export async function listarProdutos(req, res) {
    return res.status(200).json(await cardapioService.listarProdutos(req.validado.query));
}

export async function criarProduto(req, res) {
    return res.status(201).json(await cardapioService.criarProduto(req.body));
}

export async function atualizarProduto(req, res) {
    return res.status(200).json(await cardapioService.atualizarProduto(req.params.id, req.body));
}

export async function listarMesas(req, res) {
    return res.status(200).json(await cardapioService.listarMesas(req.validado.query));
}

export async function criarMesa(req, res) {
    return res.status(201).json(await cardapioService.criarMesa(req.body));
}

export async function atualizarMesa(req, res) {
    return res.status(200).json(await cardapioService.atualizarMesa(req.params.id, req.body));
}
