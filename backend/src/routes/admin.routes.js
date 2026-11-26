import express from 'express';
import { listarUsuarios, criarUsuario, desativarUsuario, reativarUsuario } from '../controllers/admin.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { criarUsuarioSchema, listarUsuariosQuerySchema } from '../schemas/admin.schema.js';

const adminRouter = express.Router();

adminRouter.use(autenticar, autorizar('admin'));

/**
 * @openapi
 * /admin/usuarios:
 *   get:
 *     tags: [Admin]
 *     summary: Lista usuários
 *     description: Busca por nome, sobrenome ou e-mail, com filtro opcional por perfil.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: role
 *         description: Filtra por perfil
 *         schema: { type: string, enum: [admin, funcionario, cliente] }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Usuários encontrados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListaDeUsuarios' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       403:
 *         description: Usuário não é admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
adminRouter.get('/usuarios', validarQuery(listarUsuariosQuerySchema), listarUsuarios);

/**
 * @openapi
 * /admin/usuarios:
 *   post:
 *     tags: [Admin]
 *     summary: Cria um funcionário ou outro admin
 *     description: >
 *       Clientes se cadastram sozinhos em `/auth/cadastro`; funcionários e admins só são criados
 *       por aqui. Funcionários lançam pedidos na mesa, fazem check-in de reservas e recebem a
 *       taxa de serviço dos pedidos que atendem.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, sobrenome, email, senha, role]
 *             properties:
 *               nome: { type: string, example: Carlos }
 *               sobrenome: { type: string, example: Pereira }
 *               email: { type: string, format: email, example: carlos@mesapronta.dev }
 *               senha: { type: string, format: password, minLength: 6, maxLength: 72 }
 *               telefoneCelular: { type: string, example: '(48) 99999-1111', description: Opcional }
 *               role: { type: string, enum: [funcionario, admin] }
 *     responses:
 *       201:
 *         description: Usuário criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400: { $ref: '#/components/responses/DadosInvalidos' }
 *       401: { $ref: '#/components/responses/NaoAutenticado' }
 *       403: { $ref: '#/components/responses/SemPermissao' }
 *       409:
 *         description: E-mail já cadastrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
adminRouter.post('/usuarios', validar(criarUsuarioSchema), criarUsuario);

/**
 * @openapi
 * /admin/usuarios/{id}/desativar:
 *   patch:
 *     tags: [Admin]
 *     summary: Desativa um usuário
 *     description: Não permite que o admin desative a própria conta.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Usuário desativado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: ID inválido ou tentativa de desativar a própria conta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       403:
 *         description: Usuário não é admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
adminRouter.patch('/usuarios/:id/desativar', validar(idParamSchema, 'params'), desativarUsuario);

/**
 * @openapi
 * /admin/usuarios/{id}/reativar:
 *   patch:
 *     tags: [Admin]
 *     summary: Reativa um usuário
 *     description: Restaura o acesso da conta selecionada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Usuário reativado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       403:
 *         description: Usuário não é admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
adminRouter.patch('/usuarios/:id/reativar', validar(idParamSchema, 'params'), reativarUsuario);

export default adminRouter;
