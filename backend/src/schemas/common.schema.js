import { z } from 'zod';

const somenteDigitos = (valor) => String(valor).replace(/\D/g, '');

// Mensagem de erro em português para campo ausente/vazio; senão, a mensagem de "inválido"
export const erroCampo = (mensagemInvalida) => (issue) =>
    issue.input === undefined || issue.input === '' ? 'Campo obrigatório' : mensagemInvalida;

export const emailSchema = z
    .string({ error: erroCampo('E-mail inválido') })
    .trim()
    .toLowerCase()
    .email('E-mail inválido');

export const senhaSchema = z
    .string({ error: erroCampo('Senha inválida') })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres');

export const idParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export const nomeSchema = z
    .string({ error: erroCampo('Nome inválido') })
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100);

export const sobrenomeSchema = z
    .string({ error: erroCampo('Sobrenome inválido') })
    .trim()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(100);

export function normalizarTelefone(valor) {
    let digitos = somenteDigitos(valor);
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
        digitos = digitos.slice(2); // remove +55
    }
    return digitos;
}

export const celularSchema = z
    .string({ error: erroCampo('Celular inválido') })
    .min(1, 'Campo obrigatório')
    .transform(normalizarTelefone)
    .refine((v) => /^[1-9]{2}9\d{8}$/.test(v), 'Celular inválido (use DDD + 9 dígitos)');

// Campo não obrigatório: "" vindo de formulário vira "não informado"
export const opcional = (schema) =>
    z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

// Campo não obrigatório que o usuário pode apagar: "" ou null viram null
export const anulavel = (schema) =>
    z.preprocess((v) => (v === '' ? null : v), schema.nullable().optional());