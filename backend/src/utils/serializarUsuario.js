// Formato público do usuário: nunca expõe a senha.
export function serializarUsuario(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        telefoneCelular: usuario.telefoneCelular ?? null,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
    };
}
