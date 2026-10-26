// Cliente HTTP da API. Todas as chamadas ao backend passam por aqui:
// URL base, token no header e erros no formato do backend ({ mensagem, detalhes }).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const CHAVE_TOKEN = 'portal-vagas:token';

// Erro de qualquer resposta que não seja 2xx.
// status 0 = o servidor não respondeu (API desligada, sem rede).
export class ErroApi extends Error {
  constructor(status, mensagem, detalhes = []) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Erros de validação do Zod viram { campo: mensagem }, prontos para o helperText do MUI.
// Ex.: errosPorCampo(erro).email -> 'E-mail inválido'
export function errosPorCampo(erro) {
  return Object.fromEntries((erro?.detalhes ?? []).map((d) => [d.campo, d.mensagem]));
}

// O localStorage pode falhar (aba anônima, armazenamento bloqueado): por isso o try/catch.
export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    // sem armazenamento, a sessão dura até recarregar a página
  }
}

export function apagarToken() {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // nada a fazer
  }
}

// O AuthContext registra aqui o que fazer quando o token expira (401 com token).
let aoExpirarSessao = null;
export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

function montarUrl(rota, query) {
  const url = new URL(rota, API_URL);
  for (const [chave, valor] of Object.entries(query ?? {})) {
    const vazio = valor === undefined || valor === null || valor === '' || (Array.isArray(valor) && valor.length === 0);
    if (!vazio) url.searchParams.set(chave, Array.isArray(valor) ? valor.join(',') : valor);
  }
  return url;
}

async function requisitar(rota, { metodo = 'GET', corpo, query, resposta = 'json' } = {}) {
  const token = lerToken();
  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(montarUrl(rota, query), {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  if (!res.ok) {
    // 401 com token = sessão expirada. Sem token (login errado), é só um erro comum.
    if (res.status === 401 && token) aoExpirarSessao?.();
    const dados = await res.json().catch(() => ({}));
    throw new ErroApi(res.status, dados.mensagem ?? 'Erro inesperado. Tente de novo.', dados.detalhes);
  }

  if (res.status === 204) return null;
  if (resposta === 'blob') {
    // attachment; filename="curriculo-ana-souza.pdf" (o backend expõe esse header no CORS)
    const nomeArquivo = res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1];
    return { blob: await res.blob(), nomeArquivo };
  }
  return res.json();
}

// query: objeto de filtros. Listas viram "a,b" e valores vazios são ignorados.
export const http = {
  get: (rota, query) => requisitar(rota, { query }),
  post: (rota, corpo) => requisitar(rota, { metodo: 'POST', corpo }),
  put: (rota, corpo) => requisitar(rota, { metodo: 'PUT', corpo }),
  patch: (rota, corpo) => requisitar(rota, { metodo: 'PATCH', corpo }),
  delete: (rota) => requisitar(rota, { metodo: 'DELETE' }),
  // Devolve { blob, nomeArquivo }
  baixar: (rota) => requisitar(rota, { resposta: 'blob' }),
};
