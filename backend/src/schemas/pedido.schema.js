import { z } from 'zod';
import {
    FORMAS_PAGAMENTO, LIMITES, ORIGENS_PEDIDO, PROXIMO_STATUS_PEDIDO, STATUS_PEDIDO,
} from '../constants/restaurante.js';
import { erroCampo, opcional } from './common.schema.js';
import { booleanoQuery } from './cardapio.schema.js';

// O front manda só produto e quantidade. Nome e preço vêm do cardápio, no backend.
const itensSchema = z
    .array(
        z.object({
            produtoId: z.uuid('Produto inválido'),
            quantidade: z
                .number({ error: erroCampo('Quantidade inválida') })
                .int('Quantidade deve ser inteira')
                .min(1, 'Quantidade mínima é 1')
                .max(LIMITES.quantidadePorItem, `Quantidade máxima é ${LIMITES.quantidadePorItem}`),
        }),
        { error: erroCampo('Informe os itens do pedido') },
    )
    .min(1, 'O pedido precisa de ao menos um item')
    .max(LIMITES.itensPorPedido, `Máximo de ${LIMITES.itensPorPedido} itens por pedido`);

const formaPagamentoSchema = z.enum(FORMAS_PAGAMENTO, {
    error: `Forma de pagamento deve ser uma de: ${FORMAS_PAGAMENTO.join(', ')}`,
});
const observacaoSchema = opcional(z.string().trim().max(255, 'Observação deve ter no máximo 255 caracteres'));

// Pedido lançado pelo garçom na mesa
export const criarPedidoSchema = z.object({
    mesaId: z.uuid('Mesa inválida'),
    itens: itensSchema,
    observacao: observacaoSchema,
});

// Compra antecipada: o cliente paga na hora, junto com a reserva
export const compraAntecipadaSchema = z.object({
    itens: itensSchema,
    formaPagamento: formaPagamentoSchema,
    observacao: observacaoSchema,
});

const statusDestino = [...new Set(Object.values(PROXIMO_STATUS_PEDIDO))];
export const atualizarStatusSchema = z.object({
    status: z.enum(statusDestino, { error: `Status deve ser um de: ${statusDestino.join(', ')}` }),
});

export const pagamentoSchema = z.object({
    formaPagamento: formaPagamentoSchema,
});

export const listarPedidosQuerySchema = z.object({
    status: z.enum(STATUS_PEDIDO, { error: `Status deve ser um de: ${STATUS_PEDIDO.join(', ')}` }).optional(),
    origem: z.enum(ORIGENS_PEDIDO, { error: `Origem deve ser uma de: ${ORIGENS_PEDIDO.join(', ')}` }).optional(),
    mesaId: z.uuid('Mesa inválida').optional(),
    data: z.iso.date('Data inválida (use AAAA-MM-DD)').optional(),
    pago: booleanoQuery.optional(),
});
