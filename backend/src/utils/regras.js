// Regras de negócio puras (sem banco), para testar sem subir nada.
import { DIAS_RESERVA, FUSO, TAXA_SERVICO } from '../constants/restaurante.js';

const formatoData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit',
});
const formatoHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

// "Agora" no fuso do restaurante: { data: 'AAAA-MM-DD', hora: 'HH:MM' }
export function agoraNoFuso(agora = new Date()) {
  return { data: formatoData.format(agora), hora: formatoHora.format(agora) };
}

// Dia da semana de uma data 'AAAA-MM-DD' (0 = domingo). Meio-dia UTC evita virar o dia.
export function diaDaSemana(data) {
  return new Date(`${data}T12:00:00Z`).getUTCDay();
}

export function diaAceitaReserva(data) {
  return DIAS_RESERVA.includes(diaDaSemana(data));
}

// Reserva só no futuro: data depois de hoje, ou hoje com horário que ainda não passou.
export function ehFuturo(data, horario, agora = new Date()) {
  const atual = agoraNoFuso(agora);
  return data > atual.data || (data === atual.data && horario > atual.hora);
}

// Limites de um dia no fuso do restaurante, para filtrar colunas de data e hora.
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo em -03:00.
export function inicioDoDia(data) {
  return new Date(`${data}T00:00:00.000-03:00`);
}
export function fimDoDia(data) {
  return new Date(`${data}T23:59:59.999-03:00`);
}

// Valores sempre em centavos (inteiros): sem erro de arredondamento de float.
export function calcularValores(itens) {
  const subtotal = itens.reduce((soma, item) => soma + item.precoUnitarioCentavos * item.quantidade, 0);
  const taxaServico = Math.round(subtotal * TAXA_SERVICO);
  return { subtotalCentavos: subtotal, taxaServicoCentavos: taxaServico, totalCentavos: subtotal + taxaServico };
}

// Junta itens repetidos do mesmo produto: [{A,1},{A,2}] vira [{A,3}].
export function agruparItens(itens) {
  const porProduto = new Map();
  for (const { produtoId, quantidade } of itens) {
    porProduto.set(produtoId, (porProduto.get(produtoId) ?? 0) + quantidade);
  }
  return [...porProduto].map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

// Primeiro e último dia do mês corrente, no fuso do restaurante.
export function mesAtual(agora = new Date()) {
  const { data } = agoraNoFuso(agora);
  const [ano, mes] = data.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const mm = String(mes).padStart(2, '0');
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimoDia).padStart(2, '0')}` };
}
