import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Mesa, Produto } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { semUndefined } from '../utils/semUndefined.js';
import { CATEGORIAS_PRODUTO } from '../constants/restaurante.js';

// Ordena pela ordem do cardápio (entradas, pratos, sobremesas, bebidas) e depois pelo nome.
const ordemCategoria = (a, b) =>
    CATEGORIAS_PRODUTO.indexOf(a.categoria) - CATEGORIAS_PRODUTO.indexOf(b.categoria)
    || a.nome.localeCompare(b.nome, 'pt-BR');

// Produtos

// Cardápio público: só o que está disponível.
export async function listarCardapio({ categoria }) {
    const produtos = await Produto.findAll({ where: semUndefined({ categoria, disponivel: true }) });
    return produtos.sort(ordemCategoria);
}

// Gestão: todos os produtos, com filtros.
export async function listarProdutos({ categoria, disponivel }) {
    const produtos = await Produto.findAll({ where: semUndefined({ categoria, disponivel }) });
    return produtos.sort(ordemCategoria);
}

// Compara sem diferenciar maiúsculas: "Suco de Laranja" e "suco de laranja" são o mesmo produto.
async function garantirNomeLivre(nome, idAtual) {
    const where = { [Op.and]: [sequelize.where(sequelize.fn('lower', sequelize.col('nome')), nome.toLowerCase())] };
    if (idAtual) where.id = { [Op.ne]: idAtual };
    if (await Produto.findOne({ where })) throw new AppError(409, 'Já existe um produto com esse nome');
}

export async function criarProduto(dados) {
    await garantirNomeLivre(dados.nome);
    return Produto.create(semUndefined(dados));
}

export async function atualizarProduto(id, dados) {
    const produto = await Produto.findByPk(id);
    if (!produto) throw new AppError(404, 'Produto não encontrado');
    if (dados.nome) await garantirNomeLivre(dados.nome, id);
    // Pedidos antigos guardam nome e preço copiados: mudar aqui não altera o histórico.
    return produto.update(semUndefined(dados));
}

// Mesas

export async function listarMesas({ ativa }) {
    return Mesa.findAll({ where: semUndefined({ ativa }), order: [['numero', 'ASC']] });
}

async function garantirNumeroLivre(numero, idAtual) {
    const where = { numero };
    if (idAtual) where.id = { [Op.ne]: idAtual };
    if (await Mesa.findOne({ where })) throw new AppError(409, `A mesa ${numero} já existe`);
}

export async function criarMesa(dados) {
    await garantirNumeroLivre(dados.numero);
    return Mesa.create(semUndefined(dados));
}

export async function atualizarMesa(id, dados) {
    const mesa = await Mesa.findByPk(id);
    if (!mesa) throw new AppError(404, 'Mesa não encontrada');
    if (dados.numero !== undefined) await garantirNumeroLivre(dados.numero, id);
    // Reservas já feitas continuam valendo se a capacidade diminuir ou a mesa for desativada:
    // a regra vale para reservas novas. Cancelar as existentes é decisão do funcionário.
    return mesa.update(semUndefined(dados));
}
