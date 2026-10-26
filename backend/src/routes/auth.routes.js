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
 *     summary: Cria uma conta de usuário
 *     description: >
 *       Cria a conta com perfil `usuario` (o perfil nunca vem do corpo da requisição; campos
 *       desconhecidos são ignorados). O CPF é validado pelos dígitos verificadores, aceita
 *       pontos e traço e fica guardado cifrado; na resposta aparece mascarado. Telefones
 *       aceitam máscara e `+55` e são guardados só com dígitos. `telefoneFixo` é o único
 *       campo opcional. Esta rota não devolve token: depois do cadastro, faça login em
 *       `/auth/login`. Limite: 10 requisições por IP a cada 15 minutos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, sobrenome, email, senha, cpf, telefoneCelular, dataNascimento, paisOrigem]
 *             properties:
 *               nome: { type: string, minLength: 2, maxLength: 100, example: Maria }
 *               sobrenome: { type: string, minLength: 2, maxLength: 100, example: Silva }
 *               email: { type: string, format: email, example: maria@exemplo.com }
 *               senha: { type: string, format: password, minLength: 6, maxLength: 72 }
 *               cpf: { type: string, example: '529.982.247-25', description: 'Com ou sem pontuação' }
 *               telefoneCelular:
 *                 type: string
 *                 example: '(48) 99999-0000'
 *                 description: DDD + 9 dígitos, com ou sem máscara e `+55`
 *               telefoneFixo:
 *                 type: string
 *                 example: '(48) 3333-4444'
 *                 description: Opcional. DDD + 8 dígitos (o número começa com 2 a 5)
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 example: '1995-05-10'
 *                 description: Idade entre 14 e 120 anos
 *               paisOrigem:
 *                 type: string
 *                 example: BR
 *                 description: Código ISO 3166-1 alpha-2 (aceita minúsculas)
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
 *         description: E-mail ou CPF já cadastrado (a mensagem diz qual)
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