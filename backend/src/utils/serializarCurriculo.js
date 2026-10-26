import { TIPOS_LINK } from '../constants/enums.js';

// Formato de resposta do currículo. Recebe o objeto simples (get({ plain: true })).
//
// Fica de fora: usuarioId e cidadeNormalizada (detalhes internos) e os ids das
// tabelas filhas. Como o PUT recria as filhas, esses ids mudariam a cada
// atualização e o cliente não deve depender deles.
//
// As tabelas filhas não têm coluna de posição, então a ordem em que o usuário
// enviou não é guardada. Cada lista sai numa ordem fixa e previsível:

const texto = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR');
// Datas AAAA-MM-DD ordenam como texto. Mais recente primeiro; sem data vai para o fim.
const maisRecente = (a, b) => String(b ?? '').localeCompare(String(a ?? ''));

const ordenar = (itens, ...comparadores) => [...(itens ?? [])].sort((a, b) => {
  for (const comparar of comparadores) {
    const r = comparar(a, b);
    if (r !== 0) return r;
  }
  return 0;
});

// Indica ao front se o currículo já tem o necessário para cada uso (nada é bloqueado):
//  - match: o que os filtros e a pontuação de /vagas/recomendadas precisam (skills incluídas);
//  - pdf: o suficiente para um currículo ATS (experiências e projetos são opcionais).
export function calcularCompletude(dados) {
  const match = Boolean(
    dados.nivel && dados.modalidades?.length && dados.cidade && dados.uf && dados.skills?.length,
  );
  const pdf = match && Boolean(
    dados.nomeCompleto && dados.titulo && dados.resumo && dados.emailContato
    && dados.telefone && dados.formacoes?.length,
  );
  return { match, pdf };
}

export function serializarCurriculo(cv) {
  const dados = {
    id: cv.id,
    nomeCompleto: cv.nomeCompleto,
    titulo: cv.titulo,
    emailContato: cv.emailContato,
    telefone: cv.telefone,
    resumo: cv.resumo,
    nivel: cv.nivel,
    modalidades: cv.modalidades,
    cidade: cv.cidade,
    uf: cv.uf,

    locais: ordenar(
      cv.locais,
      (a, b) => texto(a.uf, b.uf),
      (a, b) => texto(a.cidade, b.cidade),
    ).map(({ cidade, uf }) => ({ cidade, uf })),

    experiencias: ordenar(
      cv.experiencias,
      (a, b) => Number(b.atual) - Number(a.atual),
      (a, b) => maisRecente(a.inicio, b.inicio),
    ).map(({
      empresa, cargo, cidade, uf, inicio, fim, atual, descricao,
    }) => ({
      empresa, cargo, cidade, uf, inicio, fim, atual, descricao,
    })),

    formacoes: ordenar(
      cv.formacoes,
      (a, b) => maisRecente(a.fim || a.inicio, b.fim || b.inicio),
    ).map(({
      instituicao, curso, grau, situacao, inicio, fim,
    }) => ({
      instituicao, curso, grau, situacao, inicio, fim,
    })),

    cursos: ordenar(
      cv.cursos,
      (a, b) => maisRecente(a.conclusao, b.conclusao),
      (a, b) => texto(a.nome, b.nome),
    ).map(({
      nome, instituicao, cargaHoraria, conclusao,
    }) => ({
      nome, instituicao, cargaHoraria, conclusao,
    })),

    idiomas: ordenar(cv.idiomas, (a, b) => texto(a.idioma, b.idioma))
      .map(({ idioma, nivel }) => ({ idioma, nivel })),

    links: ordenar(
      cv.links,
      (a, b) => TIPOS_LINK.indexOf(a.tipo) - TIPOS_LINK.indexOf(b.tipo),
      (a, b) => texto(a.url, b.url),
    ).map(({ tipo, url }) => ({ tipo, url })),

    projetos: ordenar(cv.projetos, (a, b) => texto(a.nome, b.nome))
      .map(({
        nome, descricao, url, tecnologias,
      }) => ({
        nome, descricao, url, tecnologias,
      })),

    skills: ordenar(cv.skills, (a, b) => texto(a.nome, b.nome))
      .map(({ id, nome }) => ({ id, nome })),

    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };

  return { ...dados, completude: calcularCompletude(dados) };
}
