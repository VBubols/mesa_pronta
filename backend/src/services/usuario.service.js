import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import Usuario from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';
import { serializarUsuario } from '../utils/serializarUsuario.js';
import { semUndefined } from '../utils/semUndefined.js';

async function buscarOuFalhar(id) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new AppError(404, 'Usuário não encontrado');
    return usuario;
}

export async function obterPerfil(id) {
    // único lugar que devolve o CPF completo: o próprio dono vendo o próprio perfil
    return serializarUsuario(await buscarOuFalhar(id), { cpfCompleto: true });
}

export async function atualizarPerfil(id, entrada) {
    const usuario = await buscarOuFalhar(id);
    const dados = semUndefined({ ...entrada });

    if (dados.email && dados.email !== usuario.email) {
        const emUso = await Usuario.findOne({
            where: { email: dados.email, id: { [Op.ne]: usuario.id } },
        });
        if (emUso) throw new AppError(409, 'E-mail já cadastrado');
    }

    if (dados.cpf && dados.cpf !== usuario.cpf) {
        const dono = await Usuario.buscarPorCpf(dados.cpf);
        if (dono && dono.id !== usuario.id) throw new AppError(409, 'CPF já cadastrado');
    }

    await usuario.update(dados);
    return serializarUsuario(usuario, { cpfCompleto: true });
}

export async function atualizarSenha(id, { senhaAntiga, novaSenha }) {
    const usuario = await buscarOuFalhar(id);

    const confere = await bcrypt.compare(senhaAntiga, usuario.senha);
    // 400 e não 401: o front pode interpretar 401 como token expirado e deslogar
    if (!confere) throw new AppError(400, 'Senha atual incorreta');

    await usuario.update({ senha: await bcrypt.hash(novaSenha, 10) });
}

export async function desativarConta(id) {
    const usuario = await buscarOuFalhar(id);
    await usuario.update({ ativo: false });
}