// Configuração do Swagger (OpenAPI 3).
//
// Como documentar uma rota nova: escreva um bloco `@openapi` (YAML) logo acima
// da rota, no próprio arquivo em src/routes/. Veja routes/admin.routes.js como
// modelo. Os schemas reaproveitáveis ficam em `components` abaixo; quem criar um
// schema novo (usado em mais de uma rota) acrescenta aqui. Schemas usados por uma
// rota só podem ficar no próprio bloco `@openapi`.
//
// A documentação fica em GET /docs (interface) e GET /docs.json (especificação).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';
import { ROLES } from '../constants/roles.js';
import {
  CATEGORIAS_PRODUTO, FORMAS_PAGAMENTO, ORIGENS_PEDIDO, STATUS_PEDIDO, STATUS_RESERVA,
} from '../constants/restaurante.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));

const texto = (extra = {}) => ({ type: 'string', ...extra });
const nulo = (schema) => ({ ...schema, nullable: true });

// Usuário: formato devolvido por cadastro, login, perfil e rotas de admin (ver utils/serializarUsuario.js).
const propriedadesUsuario = {
  id: { type: 'string', format: 'uuid' },
  nome: { type: 'string', example: 'Maria' },
  sobrenome: { type: 'string', example: 'Silva' },
  email: { type: 'string', format: 'email', example: 'maria@exemplo.com' },
  role: { type: 'string', enum: ROLES },
  ativo: { type: 'boolean', description: 'Contas desativadas não fazem login nem usam o token' },
  telefoneCelular: nulo(texto({ example: '48999990000', description: 'Só dígitos (DDD + 9 dígitos)' })),
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Mesa Pronta API',
    version: '1.0.0',
    description:
      'API do sistema de gestão do restaurante: usuários, cardápio, reservas, pedidos e financeiro. ' +
      'Rotas autenticadas exigem o header `Authorization: Bearer <token>` (obtido em `/auth/login`). ' +
      'Erros de validação (corpo, query string e parâmetros) respondem `400` com `{ mensagem, detalhes: [{ campo, mensagem }] }`. ' +
      'Todas as rotas têm um limite global de requisições por IP a cada 15 minutos (`429`); cadastro e login têm limites próprios, descritos em cada rota.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Autenticação', description: 'Cadastro e login' },
    { name: 'Usuário', description: 'Perfil, senha e conta do usuário logado' },
    { name: 'Admin', description: 'Administração de usuários: cria funcionários, lista, desativa e reativa (somente `admin`)' },
    { name: 'Cardápio', description: 'Cardápio público e gestão dos produtos' },
    { name: 'Mesas', description: 'Mesas do salão' },
    { name: 'Reservas', description: 'Reservas de mesa (sexta a domingo), compra antecipada, check-in e conclusão' },
    { name: 'Pedidos', description: 'Pedidos na mesa: lançamento, preparo, cancelamento e pagamento' },
    { name: 'Financeiro', description: 'Compras de alimentos e resumo financeiro com o repasse dos garçons (somente `admin`)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    // Respostas repetidas em quase todas as rotas: use { $ref: '#/components/responses/...' }
    responses: {
      DadosInvalidos: {
        description: 'Dados inválidos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErroDados' } } },
      },
      NaoAutenticado: {
        description: 'Token ausente, inválido ou expirado (inclui conta desativada)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      SemPermissao: {
        description: 'O perfil do usuário não tem acesso a esta rota',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      NaoEncontrado: {
        description: 'Registro não encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      Conflito: {
        description: 'A operação conflita com o estado atual (a mensagem explica)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: { mensagem: { type: 'string', example: 'Usuário não encontrado' } },
      },
      ErroValidacao: {
        type: 'object',
        description: 'Mesmo formato de `ErroDados`, usado nas rotas validadas por query string e parâmetros.',
        properties: {
          mensagem: { type: 'string', example: 'Parâmetros inválidos' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', example: 'limite' },
                mensagem: { type: 'string', example: 'Too big: expected number to be <=50' },
              },
            },
          },
        },
      },
      ErroDados: {
        type: 'object',
        properties: {
          mensagem: { type: 'string', example: 'Dados inválidos' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', example: 'telefoneCelular' },
                mensagem: { type: 'string', example: 'Celular inválido (use DDD + 9 dígitos)' },
              },
            },
          },
        },
      },
      Usuario: {
        type: 'object',
        properties: propriedadesUsuario,
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string', example: 'Risoto de cogumelos' },
          descricao: nulo(texto({ example: 'Arroz arbóreo, mix de cogumelos e parmesão' })),
          categoria: { type: 'string', enum: CATEGORIAS_PRODUTO },
          precoCentavos: { type: 'integer', example: 5890, description: 'Em centavos: 5890 = R$ 58,90' },
          disponivel: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Mesa: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          numero: { type: 'integer', example: 7 },
          capacidade: { type: 'integer', example: 4 },
          ativa: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MesaResumo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          numero: { type: 'integer', example: 7 },
          capacidade: { type: 'integer', example: 4 },
        },
      },
      PessoaResumo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string', example: 'Carlos' },
          sobrenome: { type: 'string', example: 'Pereira' },
        },
      },
      Reserva: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          data: { type: 'string', format: 'date', example: '2026-12-04' },
          horario: { type: 'string', example: '20:30' },
          pessoas: { type: 'integer', example: 4 },
          status: { type: 'string', enum: STATUS_RESERVA },
          observacao: nulo(texto()),
          clienteId: { type: 'string', format: 'uuid' },
          mesaId: { type: 'string', format: 'uuid' },
          garcomId: nulo({ type: 'string', format: 'uuid', description: 'Definido no check-in' }),
          mesa: { $ref: '#/components/schemas/MesaResumo' },
          cliente: {
            allOf: [{ $ref: '#/components/schemas/PessoaResumo' }],
            description: 'Inclui também email e telefoneCelular',
          },
          garcom: nulo({ allOf: [{ $ref: '#/components/schemas/PessoaResumo' }] }),
          pedidos: { type: 'array', items: { $ref: '#/components/schemas/Pedido' }, description: 'Pedidos ligados à reserva, inclusive a compra antecipada' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ItensEntrada: {
        type: 'array',
        minItems: 1,
        maxItems: 30,
        description: 'Só produto e quantidade: nome e preço vêm do cardápio. Itens repetidos são somados.',
        items: {
          type: 'object',
          required: ['produtoId', 'quantidade'],
          properties: {
            produtoId: { type: 'string', format: 'uuid' },
            quantidade: { type: 'integer', minimum: 1, maximum: 50, example: 2 },
          },
        },
      },
      Pedido: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          origem: { type: 'string', enum: ORIGENS_PEDIDO },
          status: { type: 'string', enum: STATUS_PEDIDO },
          subtotalCentavos: { type: 'integer', example: 11780 },
          taxaServicoCentavos: { type: 'integer', example: 1178, description: '10% do garçom' },
          totalCentavos: { type: 'integer', example: 12958 },
          formaPagamento: nulo({ type: 'string', enum: FORMAS_PAGAMENTO }),
          pagoEm: nulo({ type: 'string', format: 'date-time' }),
          pago: { type: 'boolean' },
          observacao: nulo(texto()),
          mesaId: { type: 'string', format: 'uuid' },
          reservaId: nulo({ type: 'string', format: 'uuid' }),
          clienteId: nulo({ type: 'string', format: 'uuid' }),
          garcomId: nulo({ type: 'string', format: 'uuid' }),
          itens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                produtoId: { type: 'string', format: 'uuid' },
                nomeProduto: { type: 'string', example: 'Risoto de cogumelos' },
                quantidade: { type: 'integer', example: 2 },
                precoUnitarioCentavos: { type: 'integer', example: 5890 },
              },
            },
          },
          mesa: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, numero: { type: 'integer' } } },
          garcom: nulo({ allOf: [{ $ref: '#/components/schemas/PessoaResumo' }] }),
          cliente: nulo({ allOf: [{ $ref: '#/components/schemas/PessoaResumo' }] }),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Compra: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          descricao: { type: 'string', example: 'Hortifruti da semana' },
          fornecedor: nulo(texto({ example: 'Ceasa SC' })),
          valorCentavos: { type: 'integer', example: 48000 },
          data: { type: 'string', format: 'date' },
          registradoPorId: { type: 'string', format: 'uuid' },
          registradoPor: { $ref: '#/components/schemas/PessoaResumo' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ResumoFinanceiro: {
        type: 'object',
        properties: {
          periodo: {
            type: 'object',
            properties: { inicio: { type: 'string', format: 'date' }, fim: { type: 'string', format: 'date' } },
          },
          receitaCentavos: { type: 'integer', description: 'Subtotal dos pedidos pagos (sem os 10%)' },
          despesasCentavos: { type: 'integer', description: 'Soma das compras' },
          saldoCentavos: { type: 'integer', description: 'Receita menos despesas' },
          taxaServicoCentavos: { type: 'integer', description: 'Total dos 10%, a repassar aos garçons' },
          totalRecebidoCentavos: { type: 'integer', description: 'Receita mais taxa de serviço' },
          pedidosPagos: { type: 'integer' },
          ticketMedioCentavos: { type: 'integer' },
          compras: { type: 'integer' },
          porGarcom: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                garcomId: nulo({ type: 'string', format: 'uuid', description: 'null: compra antecipada antes do check-in' }),
                nome: { type: 'string', example: 'Carlos Pereira' },
                pedidos: { type: 'integer' },
                taxaServicoCentavos: { type: 'integer' },
              },
            },
          },
          porFormaPagamento: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                formaPagamento: { type: 'string', enum: FORMAS_PAGAMENTO },
                pedidos: { type: 'integer' },
                totalCentavos: { type: 'integer' },
              },
            },
          },
          maisVendidos: {
            type: 'array',
            description: 'Os 5 produtos com mais receita no período',
            items: {
              type: 'object',
              properties: {
                nomeProduto: { type: 'string' },
                quantidade: { type: 'integer' },
                receitaCentavos: { type: 'integer' },
              },
            },
          },
        },
      },
      ListaDeUsuarios: {
        type: 'object',
        properties: {
          dados: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } },
          total: { type: 'integer', example: 42, description: 'Total de usuários que atendem à busca' },
          pagina: { type: 'integer', example: 1 },
          limite: { type: 'integer', example: 20 },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: [path.join(raiz, '../routes/*.js').replaceAll('\\', '/')],
});
