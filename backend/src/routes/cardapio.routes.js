import express from 'express';
import {
    listarCardapio, listarProdutos, criarProduto, atualizarProduto,
    listarMesas, criarMesa, atualizarMesa,
} from '../controllers/cardapio.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
    cardapioQuerySchema, listarProdutosQuerySchema, criarProdutoSchema, atualizarProdutoSchema,
    listarMesasQuerySchema, criarMesaSchema, atualizarMesaSchema,
} from '../schemas/cardapio.schema.js';

// Três routers no mesmo arquivo: cardápio público, produtos (gestão) e mesas.

export const cardapioRouter = express.Router();

/**
 * @openapi
 * /cardapio:
 *   get:
 *     tags: [Cardápio]
 *     summary: Cardápio público
 *     description: Só os produtos disponíveis, na ordem entradas, pratos, sobremesas e bebidas. Não exige login.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string, enum: [entrada, prato_principal, sobremesa, bebida] }
 *     responses:
 *       200:
 *         description: Produtos disponíveis
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Produto' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 */
cardapioRouter.get('/', validarQuery(cardapioQuerySchema), listarCardapio);

export const produtoRouter = express.Router();
produtoRouter.use(autenticar, autorizar('admin'));

/**
 * @openapi
 * /produtos:
 *   get:
 *     tags: [Cardápio]
 *     summary: Lista todos os produtos (gestão)
 *     description: Inclui os indisponíveis. Somente `admin`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string, enum: [entrada, prato_principal, sobremesa, bebida] }
 *       - in: query
 *         name: disponivel
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Produtos
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Produto' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *   post:
 *     tags: [Cardápio]
 *     summary: Cadastra um produto no cardápio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, categoria, precoCentavos]
 *             properties:
 *               nome: { type: string, example: Risoto de cogumelos }
 *               descricao: { type: string, nullable: true, maxLength: 500 }
 *               categoria: { type: string, enum: [entrada, prato_principal, sobremesa, bebida] }
 *               precoCentavos: { type: integer, example: 5890, description: 'R$ 58,90' }
 *               disponivel: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Produto criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produto' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
produtoRouter.get('/', validarQuery(listarProdutosQuerySchema), listarProdutos);
produtoRouter.post('/', validar(criarProdutoSchema), criarProduto);

/**
 * @openapi
 * /produtos/{id}:
 *   patch:
 *     tags: [Cardápio]
 *     summary: Atualiza um produto
 *     description: >
 *       Atualização parcial. Produtos não são apagados: para tirar do cardápio, envie
 *       `disponivel: false`. Pedidos antigos guardam nome e preço da época e não mudam.
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
 *               nome: { type: string }
 *               descricao: { type: string, nullable: true }
 *               categoria: { type: string, enum: [entrada, prato_principal, sobremesa, bebida] }
 *               precoCentavos: { type: integer }
 *               disponivel: { type: boolean }
 *     responses:
 *       200:
 *         description: Produto atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produto' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
produtoRouter.patch('/:id', validar(idParamSchema, 'params'), validar(atualizarProdutoSchema), atualizarProduto);

export const mesaRouter = express.Router();
mesaRouter.use(autenticar);

/**
 * @openapi
 * /mesas:
 *   get:
 *     tags: [Mesas]
 *     summary: Lista as mesas
 *     description: Funcionários usam para lançar pedidos; o admin, para gerenciar.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ativa
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Mesas em ordem de número
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Mesa' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *   post:
 *     tags: [Mesas]
 *     summary: Cadastra uma mesa
 *     description: Somente `admin`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero, capacidade]
 *             properties:
 *               numero: { type: integer, example: 7 }
 *               capacidade: { type: integer, example: 4, minimum: 1, maximum: 20 }
 *               ativa: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Mesa criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Mesa' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
mesaRouter.get('/', autorizar('funcionario', 'admin'), validarQuery(listarMesasQuerySchema), listarMesas);
mesaRouter.post('/', autorizar('admin'), validar(criarMesaSchema), criarMesa);

/**
 * @openapi
 * /mesas/{id}:
 *   patch:
 *     tags: [Mesas]
 *     summary: Atualiza uma mesa
 *     description: >
 *       Somente `admin`. Mesas não são apagadas: para tirar de uso, envie `ativa: false`.
 *       Mesa inativa não aparece na disponibilidade de reservas nem recebe pedidos novos.
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
 *               numero: { type: integer }
 *               capacidade: { type: integer }
 *               ativa: { type: boolean }
 *     responses:
 *       200:
 *         description: Mesa atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Mesa' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
mesaRouter.patch('/:id', autorizar('admin'), validar(idParamSchema, 'params'), validar(atualizarMesaSchema), atualizarMesa);
