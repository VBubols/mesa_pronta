import { z } from 'zod';
import {
    emailSchema, senhaSchema, nomeSchema, sobrenomeSchema, anulavel,
    cpfSchema, celularSchema, telefoneFixoSchema, dataNascimentoSchema, paisOrigemSchema,
} from './common.schema.js';

// Tudo é opcional no envio (atualização parcial), mas quem for enviado precisa ser válido:
// "" em campo obrigatório dá erro, só o telefone fixo pode ser apagado.
export const atualizarPerfilSchema = z
    .object({
        nome: nomeSchema.optional(),
        sobrenome: sobrenomeSchema.optional(),
        email: emailSchema.optional(),
        cpf: cpfSchema.optional(),
        telefoneCelular: celularSchema.optional(),
        telefoneFixo: anulavel(telefoneFixoSchema),
        dataNascimento: dataNascimentoSchema.optional(),
        paisOrigem: paisOrigemSchema.optional(),
    })
    .refine((dados) => Object.values(dados).some((v) => v !== undefined), {
        message: 'Informe ao menos um campo para atualizar',
    });

export const atualizarSenhaSchema = z.object({
    senhaAntiga: z.string({ error: 'Campo obrigatório' }).min(1, 'Senha antiga é obrigatória'),
    novaSenha: senhaSchema,
});