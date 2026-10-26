import pg from 'pg';
import { Sequelize } from 'sequelize';

// Produção (Supabase): a conexão vem inteira em DATABASE_URL.
// Local: continuam valendo DB_HOST, DB_USER, DB_PASSWORD, DB_NAME e DB_PORT.
const url = process.env.DATABASE_URL;

// SSL fica ligado por padrão com DATABASE_URL e desligado com as DB_*.
// DB_SSL=true ou DB_SSL=false troca o padrão.
const ssl = (process.env.DB_SSL ?? (url ? 'true' : 'false')) === 'true';

const opcoes = {
  dialect: 'postgres',
  // O Sequelize carrega o pg com um require dinâmico, que a Vercel não enxerga ao montar
  // a função: sem passar o módulo aqui, a API cai com "Please install pg package manually".
  dialectModule: pg,
  logging: false,
  // Na Vercel cada instância da função abre poucas conexões. Quem segura o resto
  // é o pooler do Supabase (porta 6543).
  pool: { max: process.env.VERCEL ? 2 : 5, min: 0, idle: 10_000, acquire: 30_000 },
  ...(ssl && {
    // Criptografa a conexão sem conferir a cadeia do certificado, como o sslmode=require.
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }),
};

const sequelize = url
  ? new Sequelize(url, opcoes)
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ...opcoes,
  });

export default sequelize;
