import { rotulo } from '../constants/rotulo.js';

export const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// 52998224725 -> 529.982.247-25 (enquanto digita)
export function mascaraCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// 48999998888 -> (48) 99999-8888 | 4833334444 -> (48) 3333-4444 (enquanto digita)
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

// '2026-10-15T14:33:24Z' -> '15/10/2026'
export function formatarData(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

// '2026-10-15T14:33:24Z' -> 'há 3 dias'
export function dataRelativa(iso) {
  if (!iso) return '';
  const dias = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (Math.abs(dias) < 1) return 'hoje';
  if (Math.abs(dias) < 30) return relativo.format(dias, 'day');
  if (Math.abs(dias) < 365) return relativo.format(Math.round(dias / 30), 'month');
  return relativo.format(Math.round(dias / 365), 'year');
}

// '2024-02-01' -> '2024-02' (valor do <input type="month">)
export const paraMes = (iso) => (iso ? String(iso).slice(0, 7) : '');

// Local da vaga para exibir: 'Florianópolis/SC', 'Santa Catarina', 'Exterior' ou null.
export function localDaVaga(vaga) {
  if (vaga.cidade) return vaga.uf ? `${vaga.cidade}/${vaga.uf}` : vaga.cidade;
  if (vaga.uf) return rotulo('ufs', vaga.uf);
  return null;
}
