import * as reservaService from '../services/reserva.service.js';

export async function opcoes(req, res) {
    return res.status(200).json(reservaService.opcoes());
}

export async function disponibilidade(req, res) {
    return res.status(200).json(await reservaService.disponibilidade(req.validado.query));
}

export async function criar(req, res) {
    return res.status(201).json(await reservaService.criar(req.usuario.id, req.body));
}

export async function minhas(req, res) {
    return res.status(200).json(await reservaService.listarDoCliente(req.usuario.id));
}

export async function listar(req, res) {
    return res.status(200).json(await reservaService.listar(req.validado.query));
}

export async function obter(req, res) {
    return res.status(200).json(await reservaService.obter(req.params.id, req.usuario));
}

export async function cancelar(req, res) {
    return res.status(200).json(await reservaService.cancelar(req.params.id, req.usuario));
}

export async function checkIn(req, res) {
    return res.status(200).json(await reservaService.checkIn(req.params.id, req.usuario, req.body));
}

export async function concluir(req, res) {
    return res.status(200).json(await reservaService.concluir(req.params.id));
}
