import express from 'express';
import { listarUsuarios, desativarUsuario, reativarUsuario } from '../controllers/admin.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';

const adminRouter = express.Router();

adminRouter.use(autenticar, autorizar('admin'));

/**
 * @openapi
 * /admin/usuarios:
 *   get:
 *     tags: [Admin]
 *     summary: Lista usuários
 *     description: Busca por nome, sobrenome ou e-mail. Paginação normalizada pelo service.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         description: Busca textual
 *         schema: { type: string }
 *       - in: query
 *         name: pagina
 *         description: Página; mínimo efetivo 1
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         description: Itens por página; limitado a 1–100
 *         schema: { type: integer, default: 20 }
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
adminRouter.get('/usuarios', listarUsuarios);

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
