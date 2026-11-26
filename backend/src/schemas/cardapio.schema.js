import { z } from 'zod';
import { CATEGORIAS_PRODUTO } from '../constants/restaurante.js';
import { anulavel, erroCampo } from './common.schema.js';

const algumCampo = (dados) => Object.values(dados).some((v) => v !== undefined);
const MSG_ALGUM_CAMPO = 'Informe ao menos um campo para atualizar';

// Query string chega como texto: 'true' / 'false'
export const booleanoQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

// Produto (item do cardápio)

const campoProduto = {
    nome: z.string({ error: erroCampo('Nome inválido') }).trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    descricao: anulavel(z.string().trim().max(500, 'Descrição deve ter no máximo 500 caracteres')),
    categoria: z.enum(CATEGORIAS_PRODUTO, { error: `Categoria deve ser uma de: ${CATEGORIAS_PRODUTO.join(', ')}` }),
    precoCentavos: z
        .number({ error: erroCampo('Preço inválido (em centavos, ex.: 3490 para R$ 34,90)') })
        .int('Preço deve ser em centavos (número inteiro)')
        .min(1, 'Preço deve ser maior que zero')
        .max(1_000_000, 'Preço máximo é R$ 10.000,00'),
    disponivel: z.boolean({ error: 'Use true ou false' }),
};

export const criarProdutoSchema = z.object({
    ...campoProduto,
    disponivel: campoProduto.disponivel.optional(),
});

export const atualizarProdutoSchema = z
    .object({
        nome: campoProduto.nome.optional(),
        descricao: campoProduto.descricao,
        categoria: campoProduto.categoria.optional(),
        precoCentavos: campoProduto.precoCentavos.optional(),
        disponivel: campoProduto.disponivel.optional(),
    })
    .refine(algumCampo, { message: MSG_ALGUM_CAMPO });

export const cardapioQuerySchema = z.object({
    categoria: campoProduto.categoria.optional(),
});

export const listarProdutosQuerySchema = z.object({
    categoria: campoProduto.categoria.optional(),
    disponivel: booleanoQuery.optional(),
});

// Mesa

const campoMesa = {
    numero: z.number({ error: erroCampo('Número inválido') }).int('Número deve ser inteiro').min(1).max(999),
    capacidade: z.number({ error: erroCampo('Capacidade inválida') }).int('Capacidade deve ser inteira').min(1).max(20),
    ativa: z.boolean({ error: 'Use true ou false' }),
};

export const criarMesaSchema = z.object({
    numero: campoMesa.numero,
    capacidade: campoMesa.capacidade,
    ativa: campoMesa.ativa.optional(),
});

export const atualizarMesaSchema = z
    .object({
        numero: campoMesa.numero.optional(),
        capacidade: campoMesa.capacidade.optional(),
        ativa: campoMesa.ativa.optional(),
    })
    .refine(algumCampo, { message: MSG_ALGUM_CAMPO });

export const listarMesasQuerySchema = z.object({
    ativa: booleanoQuery.optional(),
});
