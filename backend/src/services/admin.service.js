import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import Usuario from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';
import { serializarUsuario } from '../utils/serializarUsuario.js';
import { semUndefined } from '../utils/semUndefined.js';

export async function listarUsuarios({ pagina, limite, busca, role }) {
    const where = {};
    if (role) where.role = role;
    if (busca) {
        const termo = `%${busca.replace(/[%_\\]/g, '\\$&')}%`;
        where[Op.or] = [
            { nome: { [Op.iLike]: termo } },
            { sobrenome: { [Op.iLike]: termo } },
            { email: { [Op.iLike]: termo } },
        ];
    }

    const { rows, count } = await Usuario.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limite,
        offset: (pagina - 1) * limite,
    });

    return { dados: rows.map((u) => serializarUsuario(u)), total: count, pagina, limite };
}

export async function criarUsuario({ senha, ...dados }) {
    if (await Usuario.findOne({ where: { email: dados.email } })) {
        throw new AppError(409, 'E-mail já cadastrado');
    }
    const usuario = await Usuario.create({ ...semUndefined(dados), senha: await bcrypt.hash(senha, 10) });
    return serializarUsuario(usuario);
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