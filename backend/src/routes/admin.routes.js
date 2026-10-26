import express from 'express';
import { listarUsuarios, desativarUsuario, reativarUsuario } from '../controllers/admin.controller.js';
import { sincronizar } from '../controllers/sincronizacao.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { listarVagas, criarVaga, editarVaga, removerVaga, ocultarVaga, reexibirVaga } from '../controllers/admin-vagas.controller.js';
import { vagaInternaSchema, listarVagasAdminQuerySchema } from '../schemas/vaga.schema.js';
import { validarQuery } from '../middlewares/validator-query.middleware.js';
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

/**
 * @openapi
 * /admin/vagas/sincronizar:
 *   post:
 *     tags: [Admin]
 *     summary: Importa as vagas abertas dos repositórios do GitHub
 *     description: >
 *       Lê as issues abertas de cada fonte em src/config/fontesVagas.js, cria ou atualiza
 *       as vagas e marca como inativas as que foram fechadas no GitHub. Vagas ocultadas
 *       pelo admin continuam ocultas. Se uma fonte falhar, nenhuma vaga dela é inativada.
 *       Só um admin pode chamar, e só uma sincronização roda por vez.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo da sincronização
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fontes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fonte: { type: string, example: 'backend-br/vagas' }
 *                       issues: { type: integer, example: 62 }
 *                       ok: { type: boolean, example: true }
 *                 criadas: { type: integer, example: 55 }
 *                 atualizadas: { type: integer, example: 3 }
 *                 inalteradas: { type: integer, example: 13 }
 *                 inativadas: { type: integer, example: 2 }
 *                 descartadas: { type: integer, example: 8 }
 *                 skillsNaoEncontradas:
 *                   type: array
 *                   description: Labels de skill que não existem na tabela Skill
 *                   items: { type: string }
 *                   example: ['Apache Kafka', 'DDD']
 *                 erros: { type: array, items: { type: string } }
 *                 duracaoMs: { type: integer, example: 4210 }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: {  $ref: '#/components/schemas/Erro'  }
 *       403:
 *         description: Usuário não é admin
 *         content:
 *           application/json:
 *             schema: {  $ref: '#/components/schemas/Erro'  }
 *       409:
 *         description: Já existe uma sincronização em andamento
 *         content:
 *           application/json:
 *             schema: {  $ref: '#/components/schemas/Erro'  }
 */
adminRouter.post('/vagas/sincronizar', sincronizar);

/**
 * @openapi
 * /admin/vagas:
 *   get:
 *     tags: [Admin]
 *     summary: Lista vagas para administração
 *     description: >
 *       Inclui ocultas e inativas. Sem match. Traz descrição, link, skills e flags de visibilidade para
 *       preencher a edição.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         description: Busca em título e empresa
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: origem
 *         description: Origem da vaga
 *         schema:
 *           type: string
 *           enum:
 *             - github
 *             - interna
 *       - in: query
 *         name: ativa
 *         description: Filtrar pelo estado ativo
 *         schema:
 *           type: string
 *           enum:
 *             - 'true'
 *             - 'false'
 *       - in: query
 *         name: oculta
 *         description: Filtrar pela ocultação
 *         schema:
 *           type: string
 *           enum:
 *             - 'true'
 *             - 'false'
 *       - $ref: '#/components/parameters/Pagina'
 *       - $ref: '#/components/parameters/Limite'
 *     responses:
 *       200:
 *         description: Vagas encontradas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListaDeVagasAdmin' }
 *       400:
 *         description: Query inválida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroValidacao' }
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
adminRouter.get('/vagas', validarQuery(listarVagasAdminQuerySchema), listarVagas);

/**
 * @openapi
 * /admin/vagas:
 *   post:
 *     tags: [Admin]
 *     summary: Cria uma vaga interna
 *     description: >
 *       Origem interna, fonte e githubIssueId nulos, publicação atual e cidade normalizada são definidos
 *       pelo service. Retorna o objeto vaga do detalhe existente, sem envelope match.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VagaInternaEntrada' }
 *     responses:
 *       201:
 *         description: Vaga criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DetalheDaVaga/properties/vaga' }
 *       400:
 *         description: Body inválido ou skill inexistente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
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
adminRouter.post('/vagas', validar(vagaInternaSchema), criarVaga);

/**
 * @openapi
 * /admin/vagas/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Substitui uma vaga interna
 *     description: >
 *       Somente origem interna. Campos opcionais ausentes são apagados e skills substituídas. Preserva
 *       origem, publicação, ativa e oculta. Permite editar vaga oculta sem reexibi-la.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VagaInternaEntrada' }
 *     responses:
 *       200:
 *         description: Vaga atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DetalheDaVaga/properties/vaga' }
 *       400:
 *         description: Entrada inválida, skill inexistente ou operação proibida para vaga do GitHub
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Vaga não encontrada
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
adminRouter.put('/vagas/:id', validar(idParamSchema, 'params'), validar(vagaInternaSchema), editarVaga);

/**
 * @openapi
 * /admin/vagas/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove uma vaga interna
 *     description: >
 *       Exclusão física com remoção das associações de skills em cascata. Vagas do GitHub não podem
 *       ser apagadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Vaga removida; sem corpo
 *       400:
 *         description: Entrada inválida, skill inexistente ou operação proibida para vaga do GitHub
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Vaga não encontrada
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
adminRouter.delete('/vagas/:id', validar(idParamSchema, 'params'), removerVaga);

/**
 * @openapi
 * /admin/vagas/{id}/ocultar:
 *   patch:
 *     tags: [Admin]
 *     summary: Oculta uma vaga
 *     description: >
 *       Vale para ambas as origens. Não altera ativa; repetir a mesma ação mantém sucesso. Não requer
 *       body.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Visibilidade atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OcultacaoDeVaga' }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Vaga não encontrada
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
adminRouter.patch('/vagas/:id/ocultar', validar(idParamSchema, 'params'), ocultarVaga);

/**
 * @openapi
 * /admin/vagas/{id}/reexibir:
 *   patch:
 *     tags: [Admin]
 *     summary: Reexibe uma vaga
 *     description: >
 *       Vale para ambas as origens. Não altera ativa; repetir a mesma ação mantém sucesso. Não requer
 *       body.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Visibilidade atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OcultacaoDeVaga' }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       404:
 *         description: Vaga não encontrada
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
adminRouter.patch('/vagas/:id/reexibir', validar(idParamSchema, 'params'), reexibirVaga);

export default adminRouter;
