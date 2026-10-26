import { mascararCpf } from './cpf.js';

export function serializarUsuario(usuario, { cpfCompleto = false } = {}) {
    const cpf = usuario.cpf; // getter virtual: descriptografa
    return {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        cpf: cpf ? (cpfCompleto ? cpf : mascararCpf(cpf)) : null,
        telefoneCelular: usuario.telefoneCelular ?? null,
        telefoneFixo: usuario.telefoneFixo ?? null,
        dataNascimento: usuario.dataNascimento ?? null,
        paisOrigem: usuario.paisOrigem ?? null,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
    };
}