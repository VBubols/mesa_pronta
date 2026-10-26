import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';
import { serializarUsuario } from '../utils/serializarUsuario.js';
import { semUndefined } from '../utils/semUndefined.js';

// Hash falso para comparar mesmo quando o e-mail não existe (evita diferença de tempo)
const HASH_FALSO = bcrypt.hashSync('senha-que-nunca-sera-usada', 10);

export async function cadastrar({ senha, ...dados }) {
    if (await Usuario.findOne({ where: { email: dados.email } })) {
        throw new AppError(409, 'E-mail já cadastrado');
    }
    if (dados.cpf && (await Usuario.buscarPorCpf(dados.cpf))) {
        throw new AppError(409, 'CPF já cadastrado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    // role nunca vem do body: o schema descarta campos desconhecidos
    const usuario = await Usuario.create({ ...semUndefined(dados), senha: senhaHash });
    return serializarUsuario(usuario);
}

export async function login({ email, senha }) {
    const usuario = await Usuario.findOne({ where: { email } });

    const senhaCorreta = await bcrypt.compare(senha, usuario?.senha ?? HASH_FALSO);
    if (!usuario || !senhaCorreta) {
        throw new AppError(401, 'Credenciais inválidas');
    }

    // Só depois de validar a senha: não revela se o e-mail existe
    if (!usuario.ativo) {
        throw new AppError(403, 'Esta conta foi desativada');
    }

    const token = jwt.sign(
        { id: usuario.id, role: usuario.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h', algorithm: 'HS256' },
    );

    return { token, usuario: serializarUsuario(usuario) };
}