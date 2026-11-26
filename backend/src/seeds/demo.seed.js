import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import {
  Compra, ItemPedido, Mesa, Pedido, Produto, Reserva, Usuario,
} from '../models/index.js';
import { agoraNoFuso, calcularValores, diaAceitaReserva } from '../utils/regras.js';
import { semearAdmin } from './admin.seed.js';

// Dados de demonstração: equipe, cliente, mesas, cardápio, compras, vendas do mês
// e uma reserva para o próximo fim de semana. Senha de todas as contas: senha123.
// Roda com `npm run seed:demo` (banco vazio) ou `npm run db:reset -- --demo`.

const SENHA_DEMO = 'senha123';

const MESAS = [[1, 2], [2, 2], [3, 4], [4, 4], [5, 4], [6, 6], [7, 6], [8, 8]];

const PRODUTOS = [
  ['Bruschetta de tomate', 'entrada', 2490, 'Pão italiano, tomate, manjericão e azeite'],
  ['Bolinho de bacalhau', 'entrada', 3290, 'Seis unidades, com aioli'],
  ['Salada da casa', 'entrada', 2890, 'Folhas, palmito, tomate-cereja e molho de mostarda'],
  ['Risoto de cogumelos', 'prato_principal', 5890, 'Arroz arbóreo, mix de cogumelos e parmesão'],
  ['Filé à parmegiana', 'prato_principal', 6490, 'Com arroz e fritas'],
  ['Salmão grelhado', 'prato_principal', 7290, 'Com legumes salteados e purê de batata-doce'],
  ['Talharim ao pesto', 'prato_principal', 4790, 'Massa fresca, pesto de manjericão e castanhas'],
  ['Petit gâteau', 'sobremesa', 2690, 'Com sorvete de creme'],
  ['Pudim de leite', 'sobremesa', 1890, null],
  ['Suco de laranja', 'bebida', 1290, '500 ml'],
  ['Refrigerante lata', 'bebida', 790, null],
  ['Água com gás', 'bebida', 690, null],
  ['Cerveja artesanal', 'bebida', 2290, 'IPA local, 500 ml'],
];

const usuario = async (nome, sobrenome, email, role, telefoneCelular = null) => Usuario.create({
  nome, sobrenome, email, role, telefoneCelular, senha: await bcrypt.hash(SENHA_DEMO, 10),
});

// Data 'AAAA-MM-DD' somando dias a outra
const somarDias = (data, dias) => {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

export async function semearDemo() {
  if (await Mesa.count()) {
    console.log('Banco já tem mesas: demo não aplicada (use npm run db:reset -- --demo)');
    return;
  }

  const carlos = await usuario('Carlos', 'Pereira', 'carlos@mesapronta.dev', 'funcionario');
  const bia = await usuario('Beatriz', 'Lima', 'beatriz@mesapronta.dev', 'funcionario');
  const ana = await usuario('Ana', 'Souza', 'ana@mesapronta.dev', 'cliente', '48999990000');

  const mesas = await Mesa.bulkCreate(MESAS.map(([numero, capacidade]) => ({ numero, capacidade })));
  const produtos = await Produto.bulkCreate(
    PRODUTOS.map(([nome, categoria, precoCentavos, descricao]) => ({ nome, categoria, precoCentavos, descricao })),
  );
  const porNome = Object.fromEntries(produtos.map((p) => [p.nome, p]));

  const hoje = agoraNoFuso().data;
  const inicioMes = `${hoje.slice(0, 8)}01`;
  const admin = await Usuario.findOne({ where: { role: 'admin' } });

  await Compra.bulkCreate([
    { descricao: 'Hortifruti da semana', fornecedor: 'Ceasa SC', valorCentavos: 18000, data: inicioMes },
    { descricao: 'Carnes e peixes', fornecedor: 'Frigorífico Ilha', valorCentavos: 42000, data: inicioMes },
    { descricao: 'Bebidas', fornecedor: 'Distribuidora Litoral', valorCentavos: 15000, data: hoje },
  ].map((c) => ({ ...c, registradoPorId: admin.id })));

  // Vendas já pagas neste mês, para o financeiro ter o que mostrar
  const vendas = [
    { garcom: carlos, mesa: 2, itens: [['Risoto de cogumelos', 2], ['Suco de laranja', 2]], forma: 'pix' },
    { garcom: carlos, mesa: 5, itens: [['Filé à parmegiana', 3], ['Cerveja artesanal', 3], ['Petit gâteau', 2]], forma: 'credito' },
    { garcom: bia, mesa: 3, itens: [['Salmão grelhado', 2], ['Água com gás', 2], ['Pudim de leite', 2]], forma: 'debito' },
    { garcom: bia, mesa: 7, itens: [['Bolinho de bacalhau', 1], ['Talharim ao pesto', 4], ['Refrigerante lata', 4]], forma: 'dinheiro' },
  ];
  for (const venda of vendas) {
    const itens = venda.itens.map(([nome, quantidade]) => ({
      produtoId: porNome[nome].id, nomeProduto: nome, quantidade, precoUnitarioCentavos: porNome[nome].precoCentavos,
    }));
    await Pedido.create({
      origem: 'local',
      status: 'entregue',
      mesaId: mesas[venda.mesa - 1].id,
      garcomId: venda.garcom.id,
      formaPagamento: venda.forma,
      pagoEm: new Date(),
      ...calcularValores(itens),
      itens,
    }, { include: [{ model: ItemPedido, as: 'itens' }] });
  }

  // Reserva da Ana no próximo fim de semana, com compra antecipada
  let data = somarDias(hoje, 1);
  while (!diaAceitaReserva(data)) data = somarDias(data, 1);
  const reserva = await Reserva.create({
    data, horario: '20:30', pessoas: 4, clienteId: ana.id, mesaId: mesas[2].id, observacao: 'Aniversário',
  });
  const itensAntecipados = [['Bruschetta de tomate', 1], ['Suco de laranja', 4]].map(([nome, quantidade]) => ({
    produtoId: porNome[nome].id, nomeProduto: nome, quantidade, precoUnitarioCentavos: porNome[nome].precoCentavos,
  }));
  await Pedido.create({
    origem: 'antecipado',
    status: 'agendado',
    mesaId: reserva.mesaId,
    reservaId: reserva.id,
    clienteId: ana.id,
    formaPagamento: 'pix',
    pagoEm: new Date(),
    ...calcularValores(itensAntecipados),
    itens: itensAntecipados,
  }, { include: [{ model: ItemPedido, as: 'itens' }] });

  console.log(`Demo criada. Contas (senha ${SENHA_DEMO}): carlos@ e beatriz@ (funcionários), ana@ (cliente), todas @mesapronta.dev`);
}

// Executado direto (npm run seed:demo): cria as tabelas que faltam, o admin e a demo.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await sequelize.sync();
    await semearAdmin();
    await semearDemo();
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
