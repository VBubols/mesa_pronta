// Rótulos dos valores que a API devolve como código ('junior' -> 'Júnior').
// A ordem de cada grupo é a mesma de backend/src/constants/enums.js.
// Se um valor mudar lá, mude aqui também.

export const ROTULOS = {
  niveis: {
    estagio: 'Estágio',
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior',
    especialista: 'Especialista',
  },
  modalidades: { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' },
  contratacoes: {
    clt: 'CLT',
    pj: 'PJ',
    estagio: 'Estágio',
    freelance: 'Freelance',
    temporario: 'Temporário',
    outro: 'Outro',
  },
  stacks: { backend: 'Back-end', frontend: 'Front-end', fullstack: 'Full Stack', mobile: 'Mobile' },
  ufs: {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
    DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
    PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
    SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
  },
  graus: {
    tecnico: 'Técnico',
    tecnologo: 'Tecnólogo',
    graduacao: 'Graduação',
    pos_graduacao: 'Pós-graduação',
    mestrado: 'Mestrado',
    doutorado: 'Doutorado',
  },
  situacoesFormacao: { concluido: 'Concluído', cursando: 'Cursando', trancado: 'Trancado' },
  niveisIdioma: {
    basico: 'Básico',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
    fluente: 'Fluente',
    nativo: 'Nativo',
  },
  tiposLink: { github: 'GitHub', linkedin: 'LinkedIn', portfolio: 'Portfólio', outro: 'Outro' },
};

// rotulo('niveis', 'junior') -> 'Júnior'. Valor vazio -> 'Não informado'.
export function rotulo(grupo, valor) {
  if (valor === null || valor === undefined || valor === '') return 'Não informado';
  return ROTULOS[grupo]?.[valor] ?? valor;
}

// Para Select e Autocomplete: [{ valor: 'junior', rotulo: 'Júnior' }, ...]
export function opcoes(grupo) {
  return Object.entries(ROTULOS[grupo] ?? {}).map(([valor, texto]) => ({ valor, rotulo: texto }));
}
