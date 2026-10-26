import { z } from 'zod';
import { cpfValido, somenteDigitos } from '../utils/cpf.js';

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

export const cpfSchema = z
    .string({ error: erroCampo('CPF inválido') })
    .min(1, 'Campo obrigatório')
    .transform(somenteDigitos)
    .refine(cpfValido, 'CPF inválido');

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

export const telefoneFixoSchema = z
    .string({ error: erroCampo('Telefone fixo inválido') })
    .min(1, 'Campo obrigatório')
    .transform(normalizarTelefone)
    .refine((v) => /^[1-9]{2}[2-5]\d{7}$/.test(v), 'Telefone fixo inválido (use DDD + 8 dígitos)');

export const dataNascimentoSchema = z
    .iso.date({ error: erroCampo('Data inválida (use AAAA-MM-DD)') })
    .refine((valor) => {
        const nasc = new Date(`${valor}T00:00:00Z`);
        const hoje = new Date();
        let idade = hoje.getUTCFullYear() - nasc.getUTCFullYear();
        const aindaNaoFez =
            hoje.getUTCMonth() < nasc.getUTCMonth() ||
            (hoje.getUTCMonth() === nasc.getUTCMonth() && hoje.getUTCDate() < nasc.getUTCDate());
        if (aindaNaoFez) idade--;
        return idade >= 14 && idade <= 120;
    }, 'Data de nascimento fora do intervalo permitido (14 a 120 anos)');

const nomesDePaises = new Intl.DisplayNames(['pt-BR'], { type: 'region', fallback: 'none' });

export const paisOrigemSchema = z
    .string({ error: erroCampo('País inválido') })
    .trim()
    .min(1, 'Campo obrigatório')
    .toUpperCase()
    .refine(
        (codigo) => /^[A-Z]{2}$/.test(codigo) && nomesDePaises.of(codigo) !== undefined,
        'País inválido (use o código ISO de 2 letras, ex.: BR)',
    );

// Campo não obrigatório: "" vindo de formulário vira "não informado"
export const opcional = (schema) =>
    z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

// Campo não obrigatório que o usuário pode apagar: "" ou null viram null
export const anulavel = (schema) =>
    z.preprocess((v) => (v === '' ? null : v), schema.nullable().optional());