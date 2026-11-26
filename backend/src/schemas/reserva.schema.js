import { z } from 'zod';
import { HORARIOS_RESERVA, LIMITES, STATUS_RESERVA } from '../constants/restaurante.js';
import { diaAceitaReserva, ehFuturo } from '../utils/regras.js';
import { erroCampo, opcional } from './common.schema.js';

const dataSchema = z.iso.date({ error: erroCampo('Data inválida (use AAAA-MM-DD)') });
const horarioSchema = z.enum(HORARIOS_RESERVA, { error: `Horário deve ser um de: ${HORARIOS_RESERVA.join(', ')}` });
const pessoasSchema = z.coerce
    .number({ error: erroCampo('Número de pessoas inválido') })
    .int('Número de pessoas deve ser inteiro')
    .min(1, 'Mínimo de 1 pessoa')
    .max(LIMITES.pessoasPorReserva, `Máximo de ${LIMITES.pessoasPorReserva} pessoas por reserva`);

// Regras da casa, aplicadas na entrada da API: só sexta a domingo e só no futuro.
function validarDataReserva(dados, ctx) {
    if (!diaAceitaReserva(dados.data)) {
        ctx.addIssue({ code: 'custom', path: ['data'], message: 'Reservas só às sextas, sábados e domingos' });
    } else if (dados.horario && !ehFuturo(dados.data, dados.horario)) {
        ctx.addIssue({ code: 'custom', path: ['data'], message: 'A data e o horário precisam estar no futuro' });
    }
}

export const criarReservaSchema = z
    .object({
        data: dataSchema,
        horario: horarioSchema,
        pessoas: pessoasSchema,
        // Opcional: sem mesa, o sistema escolhe a menor mesa livre que comporta o grupo.
        mesaId: opcional(z.uuid('Mesa inválida')),
        observacao: opcional(z.string().trim().max(255, 'Observação deve ter no máximo 255 caracteres')),
    })
    .superRefine(validarDataReserva);

export const disponibilidadeQuerySchema = z
    .object({
        data: dataSchema,
        pessoas: pessoasSchema,
        horario: horarioSchema.optional(),
    })
    .superRefine(validarDataReserva);

export const listarReservasQuerySchema = z.object({
    data: dataSchema.optional(),
    status: z.enum(STATUS_RESERVA, { error: `Status deve ser um de: ${STATUS_RESERVA.join(', ')}` }).optional(),
});

// Corpo opcional: sem garcomId, o funcionário que faz o check-in vira o garçom da mesa.
export const checkInSchema = z.preprocess(
    (v) => v ?? {},
    z.object({ garcomId: opcional(z.uuid('Garçom inválido')) }),
);
