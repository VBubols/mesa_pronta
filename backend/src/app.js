import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';

// Importa todos os models pra que o sequelize.sync() conheça as tabelas.
import './models/index.js';

import { createRequire } from 'node:module';
import swaggerUi from 'swagger-ui-express';

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/usuario.routes.js';
import adminRouter from './routes/admin.routes.js';
import skillRouter from './routes/skill.routes.js';
import vagaRouter from './routes/vaga.routes.js';
import curriculoPdfRouter from './routes/curriculo-pdf.routes.js';
import curriculoRouter from './routes/curriculo.routes.js';
import { swaggerSpec } from './config/swagger.js';
import { corsConfig } from './config/cors.js';
import { helmetConfig } from './config/helmet.js';
import { limitadorGlobal } from './config/rateLimit.js';
import { rotaNaoEncontrada, tratadorDeErros } from './middlewares/error.middleware.js';
import { validarChaves } from './utils/cripto.js';

const { version: versaoSwaggerUi } = createRequire(import.meta.url)('swagger-ui-dist/package.json');

// Na Vercel (VERCEL=1) o app vira uma função: não abre porta e não sincroniza o
// banco a cada inicialização. As tabelas são criadas uma vez com npm run seed:skills.
const naVercel = Boolean(process.env.VERCEL);

const obrigatorias = [
  'JWT_SECRET', 'CPF_CHAVE_CRIPTO', 'CPF_CHAVE_HASH',
  // Banco: DATABASE_URL (Supabase) ou as variáveis DB_* (Postgres local)
  ...(process.env.DATABASE_URL ? [] : ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT']),
  ...(naVercel ? [] : ['PORT']),
];
const faltando = obrigatorias.filter((nome) => !process.env[nome]);
if (faltando.length) {
  console.error(`Variáveis de ambiente ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}
validarChaves();

const app = express();

// Atrás do proxy da Vercel o IP do usuário vem no X-Forwarded-For. Sem isso, todo
// mundo teria o IP do proxy e dividiria os mesmos limites de requisição.
if (naVercel) app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(cors(corsConfig));
app.use(express.json());

// Documentação da API. Fica antes do limitador global para os arquivos da
// interface não gastarem a cota de requisições.
// Na Vercel o express.static não serve arquivos, então a interface do Swagger
// carrega o CSS e o JS do CDN, na mesma versão do swagger-ui-dist instalado.
const swaggerUiCdn = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${versaoSwaggerUi}`;
const opcoesSwaggerUi = naVercel
  ? {
    customCssUrl: `${swaggerUiCdn}/swagger-ui.css`,
    customJs: [`${swaggerUiCdn}/swagger-ui-bundle.js`, `${swaggerUiCdn}/swagger-ui-standalone-preset.js`],
  }
  : {};
app.get('/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, opcoesSwaggerUi));

app.use(limitadorGlobal);

app.use('/auth', authRouter);
app.use('/usuario', userRouter);
app.use('/admin', adminRouter);
app.use('/skills', skillRouter);
app.use('/vagas', vagaRouter);
app.use('/curriculo/pdf', curriculoPdfRouter);
app.use('/curriculo', curriculoRouter);

app.use(rotaNaoEncontrada);
app.use(tratadorDeErros); // sempre por último

// A Vercel usa este export como a função da API.
export default app;

if (!naVercel) {
  sequelize
    .sync()
    .then(() => {
      app.listen(process.env.PORT, () => {
        console.log(`Rodando o servidor na porta: ${process.env.PORT}`);
      });
    })
    .catch((erro) => {
      console.error('Falha ao conectar/sincronizar o banco:', erro.message);
      process.exit(1);
    });
}
