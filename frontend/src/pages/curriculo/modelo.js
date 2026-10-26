import { paraMes } from '../../utils/formatos.js';

// Limites de quantidade (iguais a backend/src/constants/curriculo.limites.js).
export const LIMITES = {
  resumo: 600,
  descricaoExperiencia: 500,
  descricaoProjeto: 400,
  experiencias: 10,
  formacoes: 6,
  cursos: 15,
  idiomas: 6,
  links: 6,
  locais: 5,
  projetos: 6,
  skills: 30,
  tecnologias: 10,
};

// Item vazio de cada lista. Datas ficam como 'AAAA-MM' (o <input type="month">).
export const NOVOS = {
  locais: () => ({ cidade: '', uf: '' }),
  experiencias: () => ({ empresa: '', cargo: '', cidade: '', uf: '', inicio: '', fim: '', atual: false, descricao: '' }),
  formacoes: () => ({ instituicao: '', curso: '', grau: '', situacao: '', inicio: '', fim: '' }),
  cursos: () => ({ nome: '', instituicao: '', cargaHoraria: '', conclusao: '' }),
  idiomas: () => ({ idioma: '', nivel: '' }),
  links: () => ({ tipo: '', url: '' }),
  projetos: () => ({ nome: '', descricao: '', url: '', tecnologias: [] }),
};

export function curriculoVazio(usuario) {
  return {
    nomeCompleto: usuario ? `${usuario.nome} ${usuario.sobrenome}`.trim() : '',
    titulo: '',
    emailContato: usuario?.email ?? '',
    telefone: '',
    resumo: '',
    nivel: '',
    modalidades: [],
    cidade: '',
    uf: '',
    locais: [],
    experiencias: [],
    formacoes: [],
    cursos: [],
    idiomas: [],
    links: [],
    projetos: [],
    skills: [],
  };
}

const texto = (valor) => valor ?? '';

// Resposta da API -> estado do formulário (null vira '', data vira 'AAAA-MM').
export function deApi(cv) {
  return {
    nomeCompleto: texto(cv.nomeCompleto),
    titulo: texto(cv.titulo),
    emailContato: texto(cv.emailContato),
    telefone: texto(cv.telefone),
    resumo: texto(cv.resumo),
    nivel: texto(cv.nivel),
    modalidades: cv.modalidades ?? [],
    cidade: texto(cv.cidade),
    uf: texto(cv.uf),
    locais: cv.locais.map((l) => ({ cidade: texto(l.cidade), uf: texto(l.uf) })),
    experiencias: cv.experiencias.map((e) => ({
      empresa: texto(e.empresa),
      cargo: texto(e.cargo),
      cidade: texto(e.cidade),
      uf: texto(e.uf),
      inicio: paraMes(e.inicio),
      fim: paraMes(e.fim),
      atual: Boolean(e.atual),
      descricao: texto(e.descricao),
    })),
    formacoes: cv.formacoes.map((f) => ({
      instituicao: texto(f.instituicao),
      curso: texto(f.curso),
      grau: texto(f.grau),
      situacao: texto(f.situacao),
      inicio: paraMes(f.inicio),
      fim: paraMes(f.fim),
    })),
    cursos: cv.cursos.map((c) => ({
      nome: texto(c.nome),
      instituicao: texto(c.instituicao),
      cargaHoraria: c.cargaHoraria ?? '',
      conclusao: paraMes(c.conclusao),
    })),
    idiomas: cv.idiomas.map((i) => ({ idioma: texto(i.idioma), nivel: texto(i.nivel) })),
    links: cv.links.map((l) => ({ tipo: texto(l.tipo), url: texto(l.url) })),
    projetos: cv.projetos.map((p) => ({
      nome: texto(p.nome),
      descricao: texto(p.descricao),
      url: texto(p.url),
      tecnologias: p.tecnologias ?? [],
    })),
    skills: cv.skills,
  };
}

const ouNulo = (valor) => (valor === '' || valor === undefined ? null : valor);

// Estado do formulário -> corpo do POST/PUT /curriculo.
// Campos opcionais vazios vão como null; os obrigatórios vazios vão como '' e o backend aponta o erro.
export function paraApi(form) {
  return {
    nomeCompleto: form.nomeCompleto,
    titulo: form.titulo,
    emailContato: form.emailContato,
    telefone: form.telefone,
    resumo: form.resumo,
    nivel: form.nivel,
    modalidades: form.modalidades,
    cidade: form.cidade,
    uf: form.uf,
    locais: form.locais,
    experiencias: form.experiencias.map((e) => ({
      ...e,
      cidade: ouNulo(e.cidade),
      uf: ouNulo(e.uf),
      fim: e.atual ? null : ouNulo(e.fim),
      descricao: ouNulo(e.descricao),
    })),
    formacoes: form.formacoes.map((f) => ({ ...f, inicio: ouNulo(f.inicio), fim: ouNulo(f.fim) })),
    cursos: form.cursos.map((c) => ({
      nome: c.nome,
      instituicao: ouNulo(c.instituicao),
      cargaHoraria: c.cargaHoraria === '' ? null : Number(c.cargaHoraria),
      conclusao: ouNulo(c.conclusao),
    })),
    idiomas: form.idiomas,
    links: form.links,
    projetos: form.projetos.map((p) => ({
      nome: p.nome,
      descricao: ouNulo(p.descricao),
      url: ouNulo(p.url),
      tecnologias: p.tecnologias.length ? p.tecnologias : null,
    })),
    skills: form.skills.map((s) => s.id),
  };
}
