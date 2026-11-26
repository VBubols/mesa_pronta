import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import { Usuario } from '../models/index.js';

// Cria (ou promove) o primeiro admin a partir do .env. Roda sozinho com `npm run seed`
// e também é chamado pelo `npm run db:reset`.
export async function semearAdmin() {
  const {
    ADMIN_NOME = 'Administrador',
    ADMIN_SOBRENOME = 'Sistema',
    ADMIN_EMAIL,
    ADMIN_SENHA,
  } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_SENHA || ADMIN_SENHA.length < 6) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_SENHA (mín. 6 caracteres) no .env');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existente = await Usuario.findOne({ where: { email } });

  if (!existente) {
    await Usuario.create({
      nome: ADMIN_NOME,
      sobrenome: ADMIN_SOBRENOME,
      email,
      senha: await bcrypt.hash(ADMIN_SENHA, 10),
      role: 'admin',
    });
    console.log(`Admin criado: ${email}`);
  } else if (existente.role !== 'admin' || !existente.ativo) {
    await existente.update({ role: 'admin', ativo: true });
    console.log(`Usuário existente promovido a admin: ${email}`);
  } else {
    console.log(`Admin já existe: ${email}`);
  }
}

// Executado direto (npm run seed): cria as tabelas que faltam e o admin.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await sequelize.sync();
    await semearAdmin();
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
