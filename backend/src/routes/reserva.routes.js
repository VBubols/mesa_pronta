import express from 'express';
import {
    opcoes, disponibilidade, criar, minhas, listar, obter, cancelar, checkIn, concluir,
} from '../controllers/reserva.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
import { criarAntecipado } from '../controllers/pedido.controller.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { compraAntecipadaSchema } from '../schemas/pedido.schema.js';
import {
    criarReservaSchema, disponibilidadeQuerySchema, listarReservasQuerySchema, checkInSchema,
} from '../schemas/reserva.schema.js';

const reservaRouter = express.Router();
const gestao = autorizar('funcionario', 'admin');

/**
 * @openapi
 * /reservas/opcoes:
 *   get:
 *     tags: [Reservas]
 *     summary: Dias da semana e horários aceitos
 *     description: Para o front montar o formulário. Não exige login.
 *     security: []
 *     responses:
 *       200:
 *         description: Regras de reserva da casa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties: { dia: { type: integer, example: 5 }, nome: { type: string, example: sexta } }
 *                 horarios: { type: array, items: { type: string, example: '19:00' } }
 */
reservaRouter.get('/opcoes', opcoes);

/**
 * @openapi
 * /reservas/disponibilidade:
 *   get:
 *     tags: [Reservas]
 *     summary: Mesas livres por horário
 *     description: >
 *       Para uma data de sexta a domingo, devolve cada horário (ou só o informado) com as mesas
 *       ativas, livres e que comportam o grupo, da menor para a maior. Horários que já passaram
 *       ficam de fora. Não exige login.
 *     security: []
 *     parameters:
 *       - { in: query, name: data, required: true, schema: { type: string, format: date, example: '2026-12-04' } }
 *       - { in: query, name: pessoas, required: true, schema: { type: integer, minimum: 1, maximum: 20 } }
 *       - { in: query, name: horario, schema: { type: string, example: '19:00' } }
 *     responses:
 *       200:
 *         description: Disponibilidade
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   horario: { type: string, example: '19:00' }
 *                   mesas: { type: array, items: { $ref: '#/components/schemas/MesaResumo' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 */
reservaRouter.get('/disponibilidade', validarQuery(disponibilidadeQuerySchema), disponibilidade);

// Daqui pra baixo, só com login
reservaRouter.use(autenticar);

/**
 * @openapi
 * /reservas:
 *   post:
 *     tags: [Reservas]
 *     summary: Cliente faz uma reserva
 *     description: >
 *       Somente `cliente`. Só sexta, sábado e domingo, nos horários de `/reservas/opcoes`, e no
 *       futuro. Sem `mesaId`, o sistema escolhe a menor mesa livre que comporta o grupo. Uma
 *       mesa tem no máximo uma reserva ativa por data e horário, e o cliente também.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data, horario, pessoas]
 *             properties:
 *               data: { type: string, format: date, example: '2026-12-04' }
 *               horario: { type: string, example: '20:30' }
 *               pessoas: { type: integer, example: 4 }
 *               mesaId: { type: string, format: uuid, description: Opcional }
 *               observacao: { type: string, maxLength: 255, example: Aniversário }
 *     responses:
 *       201:
 *         description: Reserva confirmada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reserva' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 *   get:
 *     tags: [Reservas]
 *     summary: Lista reservas (gestão)
 *     description: Funcionário e admin. Filtre por data para ver a agenda do dia.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: data, schema: { type: string, format: date } }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [confirmada, em_atendimento, concluida, cancelada] }
 *     responses:
 *       200:
 *         description: Reservas por data e horário
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Reserva' } }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 */
reservaRouter.post('/', autorizar('cliente'), validar(criarReservaSchema), criar);
reservaRouter.get('/', gestao, validarQuery(listarReservasQuerySchema), listar);

/**
 * @openapi
 * /reservas/minhas:
 *   get:
 *     tags: [Reservas]
 *     summary: Reservas do cliente logado
 *     description: Somente `cliente`. Mais recentes primeiro, com os pedidos antecipados de cada uma.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas do cliente
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Reserva' } }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 */
reservaRouter.get('/minhas', autorizar('cliente'), minhas);

/**
 * @openapi
 * /reservas/{id}:
 *   get:
 *     tags: [Reservas]
 *     summary: Detalhe de uma reserva
 *     description: O cliente só vê as próprias; funcionário e admin veem todas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Reserva
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reserva' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 */
reservaRouter.get('/:id', validar(idParamSchema, 'params'), obter);

/**
 * @openapi
 * /reservas/{id}/cancelar:
 *   patch:
 *     tags: [Reservas]
 *     summary: Cancela uma reserva confirmada
 *     description: >
 *       O cliente cancela as próprias antes do horário; funcionário e admin cancelam qualquer
 *       uma. Libera a mesa e cancela a compra antecipada, se houver.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reserva' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
reservaRouter.patch('/:id/cancelar', validar(idParamSchema, 'params'), cancelar);

/**
 * @openapi
 * /reservas/{id}/check-in:
 *   patch:
 *     tags: [Reservas]
 *     summary: Registra a chegada do cliente
 *     description: >
 *       Funcionário e admin. Define o garçom da mesa: o `garcomId` informado ou, sem ele, o
 *       funcionário logado. Os pedidos antecipados da reserva vão para a cozinha e o garçom
 *       recebe a taxa de serviço deles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               garcomId: { type: string, format: uuid, description: 'Obrigatório quando quem faz o check-in é admin' }
 *     responses:
 *       200:
 *         description: Reserva em atendimento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reserva' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
reservaRouter.patch('/:id/check-in', gestao, validar(idParamSchema, 'params'), validar(checkInSchema), checkIn);

/**
 * @openapi
 * /reservas/{id}/concluir:
 *   patch:
 *     tags: [Reservas]
 *     summary: Encerra o atendimento da reserva
 *     description: Funcionário e admin. Exige que os pedidos da reserva estejam pagos ou cancelados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Reserva concluída
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reserva' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
reservaRouter.patch('/:id/concluir', gestao, validar(idParamSchema, 'params'), concluir);

/**
 * @openapi
 * /reservas/{id}/pedido:
 *   post:
 *     tags: [Reservas]
 *     summary: Compra antecipada
 *     description: >
 *       Somente o `cliente` dono da reserva, enquanto ela está confirmada e no futuro. O cliente
 *       escolhe do cardápio e paga na hora (pagamento simulado), já com os 10% do garçom. O
 *       pedido fica `agendado` e vai para a cozinha no check-in, quando ganha o garçom do
 *       atendimento. Uma compra antecipada por reserva.
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
 *             required: [itens, formaPagamento]
 *             properties:
 *               itens: { $ref: '#/components/schemas/ItensEntrada' }
 *               formaPagamento: { type: string, enum: [pix, credito, debito, dinheiro] }
 *               observacao: { type: string, maxLength: 255 }
 *     responses:
 *       201:
 *         description: Compra registrada e paga
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
reservaRouter.post('/:id/pedido', autorizar('cliente'), validar(idParamSchema, 'params'), validar(compraAntecipadaSchema), criarAntecipado);

export default reservaRouter;
