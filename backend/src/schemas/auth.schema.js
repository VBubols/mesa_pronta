import { z } from 'zod';
import {
    emailSchema, senhaSchema, nomeSchema, sobrenomeSchema, opcional,
    cpfSchema, celularSchema, telefoneFixoSchema, dataNascimentoSchema, paisOrigemSchema,
} from './common.schema.js';

export const cadastroSchema = z.object({
    nome: nomeSchema,
    sobrenome: sobrenomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    cpf: cpfSchema,
    telefoneCelular: celularSchema,
    telefoneFixo: opcional(telefoneFixoSchema), // único não obrigatório
    dataNascimento: dataNascimentoSchema,
    paisOrigem: paisOrigemSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    senha: z.string({ error: 'Campo obrigatório' }).min(1, 'Senha é obrigatória'),
});