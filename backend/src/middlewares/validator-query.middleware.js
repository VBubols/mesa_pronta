import { AppError } from '../utils/AppError.js';

// Validação de query string e de parâmetros de rota com Zod.
// No Express 5 `req.query` é somente leitura, então o resultado validado fica
// em `req.validado` (e não sobrescreve o original).
//
// Erro: lança AppError(400), que o tratadorDeErros responde no mesmo formato do
// validator.middleware.js (body): { mensagem, detalhes: [{ campo, mensagem }] }.
function validarEm(origem, schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origem]);

    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensagem: i.message,
      }));
      throw new AppError(400, 'Parâmetros inválidos', detalhes);
    }

    req.validado = { ...req.validado, [origem]: resultado.data };
    next();
  };
}

export const validarQuery = (schema) => validarEm('query', schema);
export const validarParams = (schema) => validarEm('params', schema);
