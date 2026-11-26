import 'dotenv/config';
import sequelize from '../config/database.js';
import '../models/index.js';
import { semearAdmin } from './admin.seed.js';

// APAGA todas as tabelas e recria do zero, com o admin do .env.
// Só para desenvolvimento: o sequelize.sync() normal não altera tabelas que já
// existem, então depois de mudar um model é este script que aplica a mudança.
// Com --demo, também cria os dados de demonstração (ver demo.seed.js).
if (process.env.NODE_ENV === 'production') {
  console.error('db:reset bloqueado com NODE_ENV=production');
  process.exit(1);
}

try {
  await sequelize.sync({ force: true });
  console.log('Tabelas recriadas');
  await semearAdmin();
  if (process.argv.includes('--demo')) {
    const { semearDemo } = await import('./demo.seed.js');
    await semearDemo();
  }
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
