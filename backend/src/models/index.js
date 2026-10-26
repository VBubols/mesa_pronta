// Importar este arquivo registra todos os models e suas associações.
// (as associações ficam aqui para evitar import circular entre os models)
import Usuario from './usuario.model.js';
import Skill from './skill.model.js';
import {
  Curriculo, CurriculoLocal, Experiencia, Formacao, Curso, Idioma, Link, Projeto, CurriculoSkill,
} from './curriculo.model.js';
import { Vaga, VagaSkill } from './vaga.model.js';

// Usuário 1:0..1 Currículo (exclusão em cascata)
Usuario.hasOne(Curriculo, { foreignKey: 'usuarioId', as: 'curriculo', onDelete: 'CASCADE' });
Curriculo.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Currículo 1:N tabelas filhas
const filhas = [
  [CurriculoLocal, 'locais'],
  [Experiencia, 'experiencias'],
  [Formacao, 'formacoes'],
  [Curso, 'cursos'],
  [Idioma, 'idiomas'],
  [Link, 'links'],
  [Projeto, 'projetos'],
];
for (const [model, as] of filhas) {
  Curriculo.hasMany(model, { foreignKey: 'curriculoId', as, onDelete: 'CASCADE' });
  model.belongsTo(Curriculo, { foreignKey: 'curriculoId' });
}

// N:N Currículo <-> Skill e Vaga <-> Skill
Curriculo.belongsToMany(Skill, {
  through: CurriculoSkill, foreignKey: 'curriculoId', otherKey: 'skillId', as: 'skills',
});
Skill.belongsToMany(Curriculo, {
  through: CurriculoSkill, foreignKey: 'skillId', otherKey: 'curriculoId', as: 'curriculos',
});
Vaga.belongsToMany(Skill, {
  through: VagaSkill, foreignKey: 'vagaId', otherKey: 'skillId', as: 'skills',
});
Skill.belongsToMany(Vaga, {
  through: VagaSkill, foreignKey: 'skillId', otherKey: 'vagaId', as: 'vagas',
});

export {
  Usuario, Skill, Curriculo, CurriculoLocal, Experiencia, Formacao, Curso, Idioma, Link, Projeto,
  CurriculoSkill, Vaga, VagaSkill,
};
