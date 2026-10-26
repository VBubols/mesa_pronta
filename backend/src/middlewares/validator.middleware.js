import { AppError } from '../utils/AppError.js';

// origem: 'body' (padrão) ou 'params'. No Express 5, req.query é somente leitura,
// por isso só o body é reescrito com os dados já tratados pelo Zod.
export function validar(schema, origem = 'body') {
    return (req, res, next) => {
        const resultado = schema.safeParse(req[origem]);

        if (!resultado.success) {
            const detalhes = resultado.error.issues.map((i) => ({
                campo: i.path.join('.'),
                mensagem: i.message,
            }));
            throw new AppError(400, 'Dados inválidos', detalhes);
        }

        if (origem === 'body') req.body = resultado.data;
        next();
    };
}