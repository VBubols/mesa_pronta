import express from 'express';
import {
    criarLocal, listar, obter, avancarStatus, cancelar, pagar,
} from '../controllers/pedido.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
    criarPedidoSchema, atualizarStatusSchema, pagamentoSchema, listarPedidosQuerySchema,
} from '../schemas/pedido.schema.js';

const pedidoRouter = express.Router();
const gestao = autorizar('funcionario', 'admin');
const comId = validar(idParamSchema, 'params');

pedidoRouter.use(autenticar);

/**
 * @openapi
 * /pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Garçom lança um pedido na mesa
 *     description: >
 *       Funcionário e admin. Quem lança é o garçom do pedido e recebe a taxa de serviço. O front
 *       manda só produto e quantidade; nome e preço vêm do cardápio, e subtotal, 10% e total são
 *       calculados aqui. Itens repetidos são somados. Se a mesa tem uma reserva em atendimento,
 *       o pedido fica ligado a ela.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mesaId, itens]
 *             properties:
 *               mesaId: { type: string, format: uuid }
 *               itens: { $ref: '#/components/schemas/ItensEntrada' }
 *               observacao: { type: string, maxLength: 255, example: Sem cebola }
 *     responses:
 *       201:
 *         description: Pedido aberto
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   get:
 *     tags: [Pedidos]
 *     summary: Lista pedidos (gestão)
 *     description: Funcionário e admin. Mais recentes primeiro, até 300.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [agendado, aberto, em_preparo, entregue, cancelado] }
 *       - in: query
 *         name: origem
 *         schema: { type: string, enum: [local, antecipado] }
 *       - { in: query, name: mesaId, schema: { type: string, format: uuid } }
 *       - { in: query, name: data, description: Dia em que o pedido foi feito, schema: { type: string, format: date } }
 *       - { in: query, name: pago, schema: { type: boolean } }
 *     responses:
 *       200:
 *         description: Pedidos
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Pedido' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 */
pedidoRouter.post('/', gestao, validar(criarPedidoSchema), criarLocal);
pedidoRouter.get('/', gestao, validarQuery(listarPedidosQuerySchema), listar);

/**
 * @openapi
 * /pedidos/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Detalhe de um pedido
 *     description: O cliente só vê os próprios; funcionário e admin veem todos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Pedido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 */
pedidoRouter.get('/:id', comId, obter);

/**
 * @openapi
 * /pedidos/{id}/status:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Avança o preparo do pedido
 *     description: >
 *       Funcionário e admin. Um passo por vez: `aberto` → `em_preparo` → `entregue`.
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [em_preparo, entregue] }
 *     responses:
 *       200:
 *         description: Pedido atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
pedidoRouter.patch('/:id/status', gestao, comId, validar(atualizarStatusSchema), avancarStatus);

/**
 * @openapi
 * /pedidos/{id}/cancelar:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Cancela um pedido
 *     description: >
 *       Funcionário e admin. Só pedidos agendados, abertos ou em preparo. Compra antecipada
 *       cancelada sai do financeiro (estorno simulado).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
pedidoRouter.patch('/:id/cancelar', gestao, comId, cancelar);

/**
 * @openapi
 * /pedidos/{id}/pagamento:
 *   post:
 *     tags: [Pedidos]
 *     summary: Registra o pagamento de um pedido entregue
 *     description: >
 *       Funcionário e admin. Pagamento simulado: registra a forma e a data, sem cobrança real.
 *       O total já inclui os 10% do garçom.
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
 *             required: [formaPagamento]
 *             properties:
 *               formaPagamento: { type: string, enum: [pix, credito, debito, dinheiro] }
 *     responses:
 *       200:
 *         description: Pedido pago
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
pedidoRouter.post('/:id/pagamento', gestao, comId, validar(pagamentoSchema), pagar);

export default pedidoRouter;
