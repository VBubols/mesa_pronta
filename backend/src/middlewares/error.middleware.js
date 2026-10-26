import { AppError } from '../utils/AppError.js';

export function rotaNaoEncontrada(req, res) {
    return res.status(404).json({ mensagem: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
export function tratadorDeErros(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            mensagem: err.message,
            ...(err.detalhes && { detalhes: err.detalhes }),
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ mensagem: 'Registro já cadastrado' });
    }

    if (err.message === 'Origem não permitida pelo CORS') {
        return res.status(403).json({ mensagem: err.message });
    }

    // Erros do body-parser (JSON malformado, payload grande etc.)
    if (err.expose && err.status >= 400 && err.status < 500) {
        const mensagem = err.type === 'entity.parse.failed' ? 'JSON inválido' : 'Requisição inválida';
        return res.status(err.status).json({ mensagem });
    }

    console.error(err);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
}