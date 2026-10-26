import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';

export async function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'Token não fornecido ou em formato inválido');
    }

    let payload;
    try {
        payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw new AppError(401, 'Token inválido ou expirado');
    }

    // Consulta o banco: pega mudança de role e conta desativada sem esperar o token expirar
    const usuario = await Usuario.findByPk(payload.id, { attributes: ['id', 'role', 'ativo'] });
    if (!usuario || !usuario.ativo) {
        throw new AppError(401, 'Token inválido ou expirado');
    }

    req.usuario = { id: usuario.id, role: usuario.role };
    next();
}