import express from 'express';
import {
    listarCompras, criarCompra, atualizarCompra, removerCompra, resumo,
} from '../controllers/financeiro.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { criarCompraSchema, atualizarCompraSchema, periodoQuerySchema } from '../schemas/financeiro.schema.js';

// Dois routers: compras de alimentos e resumo financeiro. Os dois só para admin.

export const compraRouter = express.Router();
compraRouter.use(autenticar, autorizar('admin'));

/**
 * @openapi
 * /compras:
 *   get:
 *     tags: [Financeiro]
 *     summary: Lista as compras de alimentos do período
 *     description: Sem período, mostra o mês atual.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: inicio, schema: { type: string, format: date } }
 *       - { in: query, name: fim, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Compras, mais recentes primeiro
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Compra' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *   post:
 *     tags: [Financeiro]
 *     summary: Registra uma compra de alimentos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descricao, valorCentavos, data]
 *             properties:
 *               descricao: { type: string, example: 'Hortifruti da semana' }
 *               fornecedor: { type: string, nullable: true, example: 'Ceasa SC' }
 *               valorCentavos: { type: integer, example: 48000, description: 'R$ 480,00' }
 *               data: { type: string, format: date, description: 'Hoje ou antes' }
 *     responses:
 *       201:
 *         description: Compra registrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Compra' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 */
compraRouter.get('/', validarQuery(periodoQuerySchema), listarCompras);
compraRouter.post('/', validar(criarCompraSchema), criarCompra);

/**
 * @openapi
 * /compras/{id}:
 *   patch:
 *     tags: [Financeiro]
 *     summary: Corrige uma compra
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao: { type: string }
 *               fornecedor: { type: string, nullable: true }
 *               valorCentavos: { type: integer }
 *               data: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Compra atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Compra' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     tags: [Financeiro]
 *     summary: Apaga uma compra lançada errado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       204: { description: Compra apagada }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 */
compraRouter.patch('/:id', validar(idParamSchema, 'params'), validar(atualizarCompraSchema), atualizarCompra);
compraRouter.delete('/:id', validar(idParamSchema, 'params'), removerCompra);

export const financeiroRouter = express.Router();
financeiroRouter.use(autenticar, autorizar('admin'));

/**
 * @openapi
 * /financeiro/resumo:
 *   get:
 *     tags: [Financeiro]
 *     summary: Resumo financeiro do período
 *     description: >
 *       Sem período, mostra o mês atual. A receita é o subtotal dos pedidos pagos no período
 *       (pela data do pagamento, sem os cancelados). Os 10% ficam fora da receita, porque são
 *       dos garçons, e aparecem separados em `porGarcom`. A despesa é a soma das compras.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: inicio, schema: { type: string, format: date } }
 *       - { in: query, name: fim, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Resumo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ResumoFinanceiro' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 */
financeiroRouter.get('/resumo', validarQuery(periodoQuerySchema), resumo);
