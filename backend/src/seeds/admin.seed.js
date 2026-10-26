import 'dotenv/config';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import Usuario from '../models/usuario.model.js';

const {
  ADMIN_NOME = 'Administrador',
  ADMIN_SOBRENOME = 'Sistema',
  ADMIN_EMAIL,
  ADMIN_SENHA,
} = process.env;

if (!ADMIN_EMAIL || !ADMIN_SENHA || ADMIN_SENHA.length < 6) {
  console.error('Defina ADMIN_EMAIL e ADMIN_SENHA (mín. 6 caracteres) no .env');
  process.exit(1);
}

try {
  await sequelize.sync();

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
} finally {
  await sequelize.close();
}