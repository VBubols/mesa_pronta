export const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// 48999998888 -> (48) 99999-8888 (enquanto digita)
export function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  const corte = numero.length > 8 ? 5 : 4;
  return numero.length > corte
    ? `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`
    : `(${ddd}) ${numero}`;
}

// Dinheiro: a API trabalha em centavos (inteiros). Só a tela mostra reais.

const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// 3490 -> 'R$ 34,90'
export const reais = (centavos) => real.format((centavos ?? 0) / 100);

// '34,90' ou '34.90' ou '34' -> 3490. Texto inválido -> null.
export function paraCentavos(texto) {
  const limpo = String(texto ?? '').trim().replace(/\s|R\$/g, '');
  if (!limpo) return null;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * 100) : null;
}

// 3490 -> '34,90' (para preencher o campo de edição)
export const centavosParaTexto = (centavos) => ((centavos ?? 0) / 100).toFixed(2).replace('.', ',');

// { [produtoId]: quantidade } -> [{ produtoId, quantidade }], o formato da API
export const paraItens = (quantidades) =>
  Object.entries(quantidades).map(([produtoId, quantidade]) => ({ produtoId, quantidade }));

// Mesmas regras do backend: 10% do garçom em cima do subtotal
export function calcularValores(itens) {
  const subtotal = itens.reduce((soma, i) => soma + i.precoCentavos * i.quantidade, 0);
  const taxa = Math.round(subtotal * 0.1);
  return { subtotal, taxa, total: subtotal + taxa };
}

// Datas: o restaurante vive no fuso de Brasília, seja onde for o navegador.

const FUSO = 'America/Sao_Paulo';
const formatoIso = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });

const formatoHora = new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Hoje em Brasília: 'AAAA-MM-DD'
export const hoje = () => formatoIso.format(new Date());

// Reserva ainda por vir? (mesma regra do backend)
export function ehFuturo(data, horario) {
  const dataHoje = hoje();
  return data > dataHoje || (data === dataHoje && horario > formatoHora.format(new Date()));
}

const meioDia = (data) => new Date(`${data}T12:00:00Z`);

export function somarDias(data, dias) {
  const d = meioDia(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const diaDaSemana = (data) => meioDia(data).getUTCDay();

// Próximas datas de sexta a domingo, a partir de hoje
export function proximosFinsDeSemana(quantidade = 6) {
  const datas = [];
  let data = hoje();
  while (datas.length < quantidade) {
    if ([5, 6, 0].includes(diaDaSemana(data))) datas.push(data);
    data = somarDias(data, 1);
  }
  return datas;
}

const inicialMaiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// '2026-11-27' -> 'Sex, 27/11'
export function dataCurta(data) {
  return inicialMaiuscula(meioDia(data)
    .toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', ''));
}

// '2026-11-27' -> 'Sexta-feira, 27 de novembro'
export function dataLonga(data) {
  return inicialMaiuscula(meioDia(data).toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }));
}

// Data e hora ISO -> '27/11 20:41' no fuso de Brasília
export function dataHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: FUSO, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// Data e hora ISO -> '20:41'
export function hora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
}

// '2026-11-27' -> '27/11/2026'
export const dataBr = (data) => (data ? data.split('-').reverse().join('/') : '');

// Primeiro e último dia do mês de uma data 'AAAA-MM-DD' ou 'AAAA-MM'
export function limitesDoMes(data) {
  const [ano, mes] = data.slice(0, 7).split('-').map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const mm = String(mes).padStart(2, '0');
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimo).padStart(2, '0')}` };
}

export const nomeCompleto = (pessoa) => (pessoa ? `${pessoa.nome} ${pessoa.sobrenome}` : '');
