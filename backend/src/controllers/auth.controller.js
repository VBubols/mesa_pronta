import * as authService from '../services/auth.service.js';

export async function cadastrar(req, res) {
    const usuario = await authService.cadastrar(req.body);
    return res.status(201).json(usuario);
}

export async function login(req, res) {
    const resultado = await authService.login(req.body);
    return res.status(200).json(resultado);
}