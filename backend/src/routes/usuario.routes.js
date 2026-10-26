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
 *     description: >
 *       Mesmo formato de `Usuario`, mas com o `cpf` completo (só dígitos), já que quem consulta
 *       é o próprio dono. Os campos internos de armazenamento do CPF não são expostos.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PerfilDoUsuario' }
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
 *       Atualização parcial: envie só o que quer mudar, mas ao menos um campo. Todos os campos
 *       abaixo são gravados. Os obrigatórios do cadastro não aceitam valor vazio; só o
 *       `telefoneFixo` pode ser apagado (envie `null` ou texto vazio). Telefones aceitam
 *       máscara e `+55` e são guardados só com dígitos. O e-mail e o CPF não podem pertencer a
 *       outra conta.
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
 *               cpf: { type: string, example: '529.982.247-25', description: 'Com ou sem pontuação' }
 *               telefoneCelular: { type: string, example: '(48) 99999-0000', description: 'DDD + 9 dígitos' }
 *               telefoneFixo:
 *                 type: string
 *                 nullable: true
 *                 example: '(48) 3333-4444'
 *                 description: 'DDD + 8 dígitos. Envie null ou texto vazio para apagar'
 *               dataNascimento: { type: string, format: date, example: '1995-05-10', description: 'Idade entre 14 e 120 anos' }
 *               paisOrigem: { type: string, example: BR, description: 'Código ISO 3166-1 alpha-2' }
 *     responses:
 *       200:
 *         description: Dados do usuário já atualizados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PerfilDoUsuario' }
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
 *         description: E-mail ou CPF já cadastrado em outra conta (a mensagem diz qual)
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