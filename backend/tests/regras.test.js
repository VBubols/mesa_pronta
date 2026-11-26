import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agoraNoFuso, agruparItens, calcularValores, diaAceitaReserva, ehFuturo, fimDoDia, inicioDoDia, mesAtual,
} from '../src/utils/regras.js';
import { criarReservaSchema } from '../src/schemas/reserva.schema.js';
import { criarPedidoSchema } from '../src/schemas/pedido.schema.js';
import { periodoQuerySchema } from '../src/schemas/financeiro.schema.js';

// Quinta-feira, 26/11/2026, 10h em Brasília (13h UTC)
const QUINTA_10H = new Date('2026-11-26T13:00:00Z');

test('reserva: só sexta, sábado e domingo', () => {
  assert.equal(diaAceitaReserva('2026-11-26'), false); // quinta
  assert.equal(diaAceitaReserva('2026-11-27'), true); // sexta
  assert.equal(diaAceitaReserva('2026-11-28'), true); // sábado
  assert.equal(diaAceitaReserva('2026-11-29'), true); // domingo
  assert.equal(diaAceitaReserva('2026-11-30'), false); // segunda
});

test('fuso: "hoje" e "agora" são de Brasília, não UTC', () => {
  // 01h UTC do dia 27 ainda é 22h do dia 26 em Brasília
  assert.deepEqual(agoraNoFuso(new Date('2026-11-27T01:00:00Z')), { data: '2026-11-26', hora: '22:00' });
});

test('reserva: precisa estar no futuro, considerando o horário de hoje', () => {
  assert.equal(ehFuturo('2026-11-27', '12:00', QUINTA_10H), true);
  assert.equal(ehFuturo('2026-11-26', '12:00', QUINTA_10H), true);
  assert.equal(ehFuturo('2026-11-26', '09:00', QUINTA_10H), false);
  assert.equal(ehFuturo('2026-11-25', '22:00', QUINTA_10H), false);
});

test('valores em centavos: subtotal, 10% arredondado e total', () => {
  const valores = calcularValores([
    { precoUnitarioCentavos: 5890, quantidade: 2 },
    { precoUnitarioCentavos: 1255, quantidade: 1 },
  ]);
  // 11780 + 1255 = 13035; 10% = 1303,5 -> 1304
  assert.deepEqual(valores, { subtotalCentavos: 13035, taxaServicoCentavos: 1304, totalCentavos: 14339 });
});

test('itens repetidos do mesmo produto são somados', () => {
  assert.deepEqual(
    agruparItens([{ produtoId: 'a', quantidade: 1 }, { produtoId: 'b', quantidade: 2 }, { produtoId: 'a', quantidade: 3 }]),
    [{ produtoId: 'a', quantidade: 4 }, { produtoId: 'b', quantidade: 2 }],
  );
});

test('limites do dia e do mês no fuso de Brasília', () => {
  assert.equal(inicioDoDia('2026-11-26').toISOString(), '2026-11-26T03:00:00.000Z');
  assert.equal(fimDoDia('2026-11-26').toISOString(), '2026-11-27T02:59:59.999Z');
  assert.deepEqual(mesAtual(QUINTA_10H), { inicio: '2026-11-01', fim: '2026-11-30' });
  assert.deepEqual(mesAtual(new Date('2028-02-10T12:00:00Z')), { inicio: '2028-02-01', fim: '2028-02-29' });
});

test('schema de reserva rejeita dia da semana errado e horário fora da lista', () => {
  const quinta = criarReservaSchema.safeParse({ data: '2030-01-03', horario: '19:00', pessoas: 2 });
  assert.equal(quinta.success, false);
  assert.equal(quinta.error.issues[0].message, 'Reservas só às sextas, sábados e domingos');

  const horario = criarReservaSchema.safeParse({ data: '2030-01-04', horario: '18:00', pessoas: 2 });
  assert.equal(horario.success, false);
  assert.equal(horario.error.issues[0].path[0], 'horario');

  assert.equal(criarReservaSchema.safeParse({ data: '2030-01-04', horario: '19:00', pessoas: 2 }).success, true);
});

test('schema de pedido não aceita preço vindo do front nem pedido vazio', () => {
  const resultado = criarPedidoSchema.parse({
    mesaId: '0b6f3c1e-8f8a-4c1b-9a51-6f6f3c1e8f8a',
    itens: [{ produtoId: '1b6f3c1e-8f8a-4c1b-9a51-6f6f3c1e8f8a', quantidade: 2, precoUnitarioCentavos: 1 }],
  });
  assert.equal('precoUnitarioCentavos' in resultado.itens[0], false);
  assert.equal(criarPedidoSchema.safeParse({ mesaId: '0b6f3c1e-8f8a-4c1b-9a51-6f6f3c1e8f8a', itens: [] }).success, false);
});

test('período do financeiro: fim não pode vir antes do início', () => {
  assert.equal(periodoQuerySchema.safeParse({ inicio: '2026-11-10', fim: '2026-11-01' }).success, false);
  assert.equal(periodoQuerySchema.safeParse({ inicio: '2026-11-01', fim: '2026-11-30' }).success, true);
  assert.equal(periodoQuerySchema.safeParse({}).success, true);
});
