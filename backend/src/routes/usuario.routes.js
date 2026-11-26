import express from 'express';
import { perfil, atualizarPerfil, atualizarSenha, desativarConta } from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { atualizarPerfilSchema, atualizarSenhaSchema } from '../schemas/usuario.schema.js';

const userRouter = express.Router();

userRouter.use(autenticar);

/**
 * @openapi
 * /usuario/perfil:
 *   get:
 *     tags: [Usuário]
 *     summary: Devolve os dados do usuário logado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.get('/perfil', perfil);
/**
 * @openapi
 * /usuario/perfil:
 *   patch:
 *     tags: [Usuário]
 *     summary: Atualiza os dados do perfil do usuário logado
 *     description: >
 *       Atualização parcial: envie só o que quer mudar, mas ao menos um campo. Os campos não
 *       aceitam valor vazio. O celular aceita máscara e `+55` e é guardado só com dígitos. O
 *       e-mail não pode pertencer a outra conta.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome: { type: string, minLength: 2, maxLength: 100, example: Maria Clara }
 *               sobrenome: { type: string, minLength: 2, maxLength: 100, example: Silva }
 *               email: { type: string, format: email, example: maria@exemplo.com }
 *               telefoneCelular: { type: string, example: '(48) 99999-0000', description: 'DDD + 9 dígitos' }
 *     responses:
 *       200:
 *         description: Dados do usuário já atualizados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Dados inválidos (inclui corpo sem nenhum campo para atualizar)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       409:
 *         description: E-mail já cadastrado em outra conta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.patch('/perfil', validar(atualizarPerfilSchema), atualizarPerfil);
/**
 * @openapi
 * /usuario/senha:
 *   patch:
 *     tags: [Usuário]
 *     summary: Troca a senha do usuário logado
 *     description: >
 *       A senha antiga precisa estar correta. A nova deve ter de 6 a 72 caracteres. Senha antiga
 *       incorreta responde `400` (e não `401`, de propósito: o front pode tratar `401` como token
 *       expirado e deslogar o usuário).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senhaAntiga, novaSenha]
 *             properties:
 *               senhaAntiga: { type: string, format: password }
 *               novaSenha: { type: string, format: password, minLength: 6, maxLength: 72 }
 *     responses:
 *       204:
 *         description: Senha alterada (sem corpo)
 *       400:
 *         description: Dados inválidos ou senha antiga incorreta (a mensagem diz qual)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.patch('/senha', validar(atualizarSenhaSchema), atualizarSenha);
/**
 * @openapi
 * /usuario/conta:
 *   delete:
 *     tags: [Usuário]
 *     summary: Desativa a conta do usuário logado
 *     description: >
 *       Exclusão lógica: os dados são mantidos, mas a conta deixa de funcionar na hora. O token
 *       atual passa a dar `401` e um novo login dá `403`. Um admin pode reativar a conta em
 *       `PATCH /admin/usuarios/{id}/reativar`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Conta desativada (sem corpo)
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.delete('/conta', desativarConta);

export default userRouter;