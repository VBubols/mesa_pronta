import { z } from 'zod';
import { agoraNoFuso } from '../utils/regras.js';
import { anulavel, erroCampo } from './common.schema.js';

const dataSchema = z.iso.date({ error: erroCampo('Data inválida (use AAAA-MM-DD)') });

// Compra (despesa com alimentos e insumos)

const campoCompra = {
    descricao: z.string({ error: erroCampo('Descrição inválida') }).trim().min(2, 'Descrição deve ter pelo menos 2 caracteres').max(200),
    fornecedor: anulavel(z.string().trim().max(100, 'Fornecedor deve ter no máximo 100 caracteres')),
    valorCentavos: z
        .number({ error: erroCampo('Valor inválido (em centavos, ex.: 15000 para R$ 150,00)') })
        .int('Valor deve ser em centavos (número inteiro)')
        .min(1, 'Valor deve ser maior que zero')
        .max(100_000_000, 'Valor máximo é R$ 1.000.000,00'),
    // Compra já feita: hoje ou antes
    data: dataSchema.refine((data) => data <= agoraNoFuso().data, 'A data da compra não pode estar no futuro'),
};

export const criarCompraSchema = z.object(campoCompra);

export const atualizarCompraSchema = z
    .object({
        descricao: campoCompra.descricao.optional(),
        fornecedor: campoCompra.fornecedor,
        valorCentavos: campoCompra.valorCentavos.optional(),
        data: campoCompra.data.optional(),
    })
    .refine((dados) => Object.values(dados).some((v) => v !== undefined), {
        message: 'Informe ao menos um campo para atualizar',
    });

// Período: os dois opcionais (o padrão é o mês atual), mas início não pode passar do fim.
export const periodoQuerySchema = z
    .object({
        inicio: dataSchema.optional(),
        fim: dataSchema.optional(),
    })
    .refine((p) => !p.inicio || !p.fim || p.inicio <= p.fim, {
        path: ['fim'], message: 'O fim do período não pode ser antes do início',
    });
