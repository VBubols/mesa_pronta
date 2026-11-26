import express from 'express';
import { cadastrar, login } from '../controllers/auth.controller.js';
import { limitadorUsuario, limitadorLogin } from '../config/rateLimit.js';
import { validar } from '../middlewares/validator.middleware.js';
import { cadastroSchema, loginSchema } from '../schemas/auth.schema.js';

const authRouter = express.Router();

/**
 * @openapi
 * /auth/cadastro:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cria uma conta de cliente
 *     description: >
 *       Cria a conta sempre com perfil `cliente` (o perfil nunca vem do corpo da requisição;
 *       campos desconhecidos são ignorados). Funcionários e admins são criados pelo admin.
 *       O celular aceita máscara e `+55` e é guardado só com dígitos. Esta rota não devolve
 *       token: depois do cadastro, faça login em `/auth/login`. Limite de cadastros por IP a
 *       cada 15 minutos (padrão 30, ajustável por `LIMITE_CADASTROS`).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, sobrenome, email, senha, telefoneCelular]
 *             properties:
 *               nome: { type: string, minLength: 2, maxLength: 100, example: Maria }
 *               sobrenome: { type: string, minLength: 2, maxLength: 100, example: Silva }
 *               email: { type: string, format: email, example: maria@exemplo.com }
 *               senha: { type: string, format: password, minLength: 6, maxLength: 72 }
 *               telefoneCelular:
 *                 type: string
 *                 example: '(48) 99999-0000'
 *                 description: DDD + 9 dígitos, com ou sem máscara e `+55`
 *     responses:
 *       201:
 *         description: Conta criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       409:
 *         description: E-mail já cadastrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       429:
 *         description: Limite de cadastros excedido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
authRouter.post('/cadastro', limitadorUsuario, validar(cadastroSchema), cadastrar);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Faz login e devolve o token JWT
 *     description: >
 *       O token (JWT, HS256) vale por 1 hora, salvo configuração diferente do servidor, e deve ir
 *       no header `Authorization: Bearer <token>`. E-mail inexistente e senha errada dão a
 *       mesma resposta `401`, de propósito. O `403` de conta desativada só aparece depois que
 *       a senha foi conferida. Só as tentativas que falham contam no limite: 3 por e-mail e IP
 *       a cada 15 minutos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string, format: email, example: maria@exemplo.com }
 *               senha: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login realizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: Token JWT }
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       403:
 *         description: Conta desativada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       429:
 *         description: Muitas tentativas de login que falharam
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
authRouter.post('/login', limitadorLogin, validar(loginSchema), login);

export default authRouter;