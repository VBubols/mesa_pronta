import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
    ItemPedido, Mesa, Pedido, Produto, Reserva, Usuario,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
    agruparItens, calcularValores, ehFuturo, fimDoDia, inicioDoDia,
} from '../utils/regras.js';
import { PROXIMO_STATUS_PEDIDO } from '../constants/restaurante.js';

export const detalhesPedido = () => [
    { model: ItemPedido, as: 'itens', attributes: ['id', 'produtoId', 'nomeProduto', 'quantidade', 'precoUnitarioCentavos'] },
    { model: Mesa, as: 'mesa', attributes: ['id', 'numero'] },
    { model: Usuario, as: 'garcom', attributes: ['id', 'nome', 'sobrenome'] },
    { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'sobrenome'] },
];

async function buscar(id, opcoes = {}) {
    const pedido = await Pedido.findByPk(id, { include: detalhesPedido(), ...opcoes });
    if (!pedido) throw new AppError(404, 'Pedido não encontrado');
    return pedido;
}

// Busca os produtos no cardápio e copia nome e preço para os itens.
// Preço nunca vem do front: é sempre o do cardápio no momento do pedido.
async function montarItens(itens, transaction) {
    const agrupados = agruparItens(itens);
    const produtos = await Produto.findAll({
        where: { id: agrupados.map((i) => i.produtoId), disponivel: true },
        transaction,
    });
    const porId = new Map(produtos.map((p) => [p.id, p]));

    const faltando = agrupados.filter((i) => !porId.has(i.produtoId));
    if (faltando.length) {
        throw new AppError(400, 'Há produtos indisponíveis ou inexistentes no pedido', faltando.map((i) => ({
            campo: 'itens', mensagem: `Produto ${i.produtoId} indisponível ou inexistente`,
        })));
    }

    return agrupados.map(({ produtoId, quantidade }) => ({
        produtoId,
        quantidade,
        nomeProduto: porId.get(produtoId).nome,
        precoUnitarioCentavos: porId.get(produtoId).precoCentavos,
    }));
}

// Grava pedido e itens juntos: se um falhar, nenhum fica no banco.
async function gravar(dados, itens, transaction) {
    const itensMontados = await montarItens(itens, transaction);
    const pedido = await Pedido.create(
        { ...dados, ...calcularValores(itensMontados), itens: itensMontados },
        { include: [{ model: ItemPedido, as: 'itens' }], transaction },
    );
    return pedido.id;
}

// Pedido na mesa. O garçom é quem lança, e é ele quem recebe os 10%.
// Se a mesa tem uma reserva em atendimento, o pedido fica ligado a ela.
export async function criarLocal(usuario, { mesaId, itens, observacao }) {
    const id = await sequelize.transaction(async (transaction) => {
        const mesa = await Mesa.findByPk(mesaId, { transaction });
        if (!mesa || !mesa.ativa) throw new AppError(404, 'Mesa não encontrada');

        const reserva = await Reserva.findOne({
            where: { mesaId, status: 'em_atendimento' },
            order: [['updatedAt', 'DESC']],
            transaction,
        });

        return gravar({
            origem: 'local',
            status: 'aberto',
            mesaId,
            observacao,
            garcomId: usuario.id,
            reservaId: reserva?.id ?? null,
            clienteId: reserva?.clienteId ?? null,
        }, itens, transaction);
    });
    return buscar(id);
}

// Compra antecipada: o cliente paga na hora (pagamento simulado), já com os 10%.
// O pedido fica "agendado" até o check-in, quando ganha o garçom e vai para a cozinha.
export async function criarAntecipado(clienteId, reservaId, { itens, formaPagamento, observacao }) {
    const id = await sequelize.transaction(async (transaction) => {
        const reserva = await Reserva.findByPk(reservaId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!reserva || reserva.clienteId !== clienteId) throw new AppError(404, 'Reserva não encontrada');
        if (reserva.status !== 'confirmada' || !ehFuturo(reserva.data, reserva.horario)) {
            throw new AppError(409, 'A compra antecipada só vale para reservas confirmadas e futuras');
        }

        const existente = await Pedido.findOne({
            where: { reservaId, origem: 'antecipado', status: { [Op.ne]: 'cancelado' } },
            transaction,
        });
        if (existente) throw new AppError(409, 'Esta reserva já tem uma compra antecipada');

        return gravar({
            origem: 'antecipado',
            status: 'agendado',
            mesaId: reserva.mesaId,
            reservaId,
            clienteId,
            observacao,
            formaPagamento,
            pagoEm: new Date(),
        }, itens, transaction);
    });
    return buscar(id);
}

export async function listar({ status, origem, mesaId, data, pago }) {
    const where = {};
    if (status) where.status = status;
    if (origem) where.origem = origem;
    if (mesaId) where.mesaId = mesaId;
    if (data) where.createdAt = { [Op.between]: [inicioDoDia(data), fimDoDia(data)] };
    if (pago !== undefined) where.pagoEm = pago ? { [Op.ne]: null } : null;

    return Pedido.findAll({
        where,
        include: detalhesPedido(),
        order: [['createdAt', 'DESC']],
        limit: 300,
    });
}

export async function obter(id, usuario) {
    const pedido = await buscar(id);
    if (usuario.role === 'cliente' && pedido.clienteId !== usuario.id) {
        throw new AppError(404, 'Pedido não encontrado');
    }
    return pedido;
}

// aberto -> em_preparo -> entregue, um passo por vez
export async function avancarStatus(id, { status }) {
    const pedido = await buscar(id);
    if (PROXIMO_STATUS_PEDIDO[pedido.status] !== status) {
        throw new AppError(409, `Um pedido "${pedido.status}" não pode ir para "${status}"`);
    }
    await pedido.update({ status });
    return buscar(id);
}

export async function cancelar(id) {
    const pedido = await buscar(id);
    if (!['agendado', 'aberto', 'em_preparo'].includes(pedido.status)) {
        throw new AppError(409, 'Só pedidos agendados, abertos ou em preparo podem ser cancelados');
    }
    // Compra antecipada cancelada sai do financeiro (estorno simulado).
    await pedido.update({ status: 'cancelado' });
    return buscar(id);
}

// Fechamento do pedido na mesa: registra a forma de pagamento (simulado).
export async function pagar(id, { formaPagamento }) {
    const pedido = await buscar(id);
    if (pedido.pagoEm) throw new AppError(409, 'Este pedido já foi pago');
    if (pedido.status !== 'entregue') throw new AppError(409, 'Só pedidos entregues podem ser pagos');

    await pedido.update({ formaPagamento, pagoEm: new Date() });
    return buscar(id);
}
