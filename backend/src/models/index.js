// Importar este arquivo registra todos os models e suas associações.
// (as associações ficam aqui para evitar import circular entre os models)
import Usuario from './usuario.model.js';
import Mesa from './mesa.model.js';
import Produto from './produto.model.js';

export { Usuario, Mesa, Produto };
