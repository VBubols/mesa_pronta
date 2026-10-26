import { Op } from 'sequelize';
import Usuario from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';
import { serializarUsuario } from '../utils/serializarUsuario.js';

export async function listarUsuarios({ pagina = 1, limite = 20, busca } = {}) {
    const p = Math.max(parseInt(pagina, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limite, 10) || 20, 1), 100);

    const where = {};
    if (typeof busca === 'string' && busca.trim()) {
        const termo = `%${busca.trim().replace(/[%_\\]/g, '\\$&')}%`;
        where[Op.or] = [
            { nome: { [Op.iLike]: termo } },
            { sobrenome: { [Op.iLike]: termo } },
            { email: { [Op.iLike]: termo } },
        ];
    }

    const { rows, count } = await Usuario.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: l,
        offset: (p - 1) * l,
    });

    return { dados: rows.map((u) => serializarUsuario(u)), total: count, pagina: p, limite: l };
}

export async function alterarStatus(id, ativo, solicitanteId) {
    if (!ativo && id === solicitanteId) {
        throw new AppError(400, 'Você não pode desativar a própria conta');
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new AppError(404, 'Usuário não encontrado');

    await usuario.update({ ativo });
    return serializarUsuario(usuario);
}