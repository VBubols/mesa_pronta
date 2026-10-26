// Normaliza texto para comparação: minúsculas, sem acento, sem emoji/símbolos soltos.
// Mantém . # + / - para não quebrar "Node.js", "C#", "C++", "CI/CD" e "Back-end".
// Segue as mesmas regras do normalizar() de services/mapeamentoLabels.service.js
// (feat/add-github-api); a única diferença é que aqui espaços repetidos viram um só.
// Usar esta função para comparar skills e labels, para todos chegarem ao mesmo resultado.
export function normalizarTexto(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // acentos
        .replace(/[^\p{L}\p{N}\s.#+/-]/gu, '') // emoji e símbolos soltos
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}