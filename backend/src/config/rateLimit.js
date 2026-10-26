import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const janela = 15 * 60 * 1000;

// Os limites podem ser ajustados por variável de ambiente sem mexer no código.
// Numa sala de aula todo mundo sai pelo mesmo IP, então os padrões não podem ser baixos.
const limite = (nome, padrao) => Number.parseInt(process.env[nome], 10) || padrao;

// Uma tela do front faz várias requisições (perfil, listas, autocomplete), por isso o
// limite geral é alto: ele existe para barrar abuso, não o uso normal.
export const limitadorGlobal = rateLimit({
    windowMs: janela,
    limit: limite('LIMITE_REQUISICOES', 1000),
    message: { mensagem: 'Muitas requisições, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const limitadorUsuario = rateLimit({
    windowMs: janela,
    limit: limite('LIMITE_CADASTROS', 30),
    message: { mensagem: 'Muitas requisições, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Conta por IP e e-mail: quem erra a própria senha não bloqueia o login dos
// colegas que estão na mesma rede.
export const limitadorLogin = rateLimit({
    windowMs: janela,
    limit: limite('LIMITE_LOGIN_FALHAS', 3),
    skipSuccessfulRequests: true, // só tentativas que falham contam
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? '').trim().toLowerCase()}`,
    message: { mensagem: 'Muitas tentativas de login, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});
