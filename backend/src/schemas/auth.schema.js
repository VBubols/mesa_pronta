import { z } from 'zod';
import {
    emailSchema, senhaSchema, nomeSchema, sobrenomeSchema, celularSchema,
} from './common.schema.js';

// Cadastro público: sempre cria cliente. O role nunca vem do body (campos
// desconhecidos são descartados pelo z.object).
export const cadastroSchema = z.object({
    nome: nomeSchema,
    sobrenome: sobrenomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    telefoneCelular: celularSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    senha: z.string({ error: 'Campo obrigatório' }).min(1, 'Senha é obrigatória'),
});
