import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Compra, Usuario } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { semUndefined } from '../utils/semUndefined.js';
import { fimDoDia, inicioDoDia, mesAtual } from '../utils/regras.js';

// Sem período informado, vale o mês atual. Se só um dos lados vier, o outro é
// completado com o início ou o fim do mês atual.
function resolverPeriodo({ inicio, fim }) {
    const padrao = mesAtual();
    const periodo = { inicio: inicio ?? padrao.inicio, fim: fim ?? padrao.fim };
    if (periodo.inicio > periodo.fim) {
        throw new AppError(400, 'O fim do período não pode ser antes do início');
    }
    return periodo;
}

// Compras

const comQuemRegistrou = () => [{ model: Usuario, as: 'registradoPor', attributes: ['id', 'nome', 'sobrenome'] }];

export async function listarCompras(filtro) {
    const { inicio, fim } = resolverPeriodo(filtro);
    return Compra.findAll({
        where: { data: { [Op.between]: [inicio, fim] } },
        include: comQuemRegistrou(),
        order: [['data', 'DESC'], ['createdAt', 'DESC']],
    });
}

async function buscarCompra(id) {
    const compra = await Compra.findByPk(id, { include: comQuemRegistrou() });
    if (!compra) throw new AppError(404, 'Compra não encontrada');
    return compra;
}

export async function criarCompra(usuarioId, dados) {
    const compra = await Compra.create({ ...semUndefined(dados), registradoPorId: usuarioId });
    return buscarCompra(compra.id);
}

export async function atualizarCompra(id, dados) {
    const compra = await buscarCompra(id);
    await compra.update(semUndefined(dados));
    return buscarCompra(id);
}

export async function removerCompra(id) {
    const compra = await buscarCompra(id);
    await compra.destroy();
}

// Resumo financeiro do período.
// Receita = subtotal dos pedidos pagos (os 10% não entram: são do garçom).
// Despesa = compras de alimentos. Saldo = receita - despesa.
export async function resumo(filtro) {
    const periodo = resolverPeriodo(filtro);
    const parametros = { inicio: inicioDoDia(periodo.inicio), fim: fimDoDia(periodo.fim) };
    // Pedido conta no dia em que foi pago, e cancelado não conta (estorno).
    const pagosNoPeriodo = `p."pagoEm" BETWEEN :inicio AND :fim AND p.status <> 'cancelado'`;
    const consulta = (sql, extra = {}) => sequelize.query(sql, {
        replacements: { ...parametros, ...extra }, type: QueryTypes.SELECT,
    });

    const [[vendas], [despesas], porGarcom, porFormaPagamento, maisVendidos] = await Promise.all([
        consulta(`
            SELECT COUNT(*)::int AS pedidos,
                   COALESCE(SUM(p."subtotalCentavos"), 0)::int AS receita,
                   COALESCE(SUM(p."taxaServicoCentavos"), 0)::int AS taxa
            FROM pedido p WHERE ${pagosNoPeriodo}`),
        consulta(`
            SELECT COUNT(*)::int AS compras, COALESCE(SUM(c."valorCentavos"), 0)::int AS total
            FROM compra c WHERE c.data BETWEEN :di AND :df`, { di: periodo.inicio, df: periodo.fim }),
        // Os 10% de cada garçom. Compra antecipada sem check-in ainda não tem garçom (null).
        consulta(`
            SELECT p."garcomId" AS "garcomId", u.nome, u.sobrenome,
                   COUNT(*)::int AS pedidos,
                   SUM(p."taxaServicoCentavos")::int AS "taxaServicoCentavos"
            FROM pedido p LEFT JOIN usuario u ON u.id = p."garcomId"
            WHERE ${pagosNoPeriodo}
            GROUP BY p."garcomId", u.nome, u.sobrenome
            ORDER BY "taxaServicoCentavos" DESC`),
        consulta(`
            SELECT p."formaPagamento" AS "formaPagamento", COUNT(*)::int AS pedidos,
                   SUM(p."totalCentavos")::int AS "totalCentavos"
            FROM pedido p WHERE ${pagosNoPeriodo}
            GROUP BY p."formaPagamento" ORDER BY "totalCentavos" DESC`),
        consulta(`
            SELECT i."nomeProduto" AS "nomeProduto", SUM(i.quantidade)::int AS quantidade,
                   SUM(i.quantidade * i."precoUnitarioCentavos")::int AS "receitaCentavos"
            FROM item_pedido i JOIN pedido p ON p.id = i."pedidoId"
            WHERE ${pagosNoPeriodo}
            GROUP BY i."nomeProduto" ORDER BY "receitaCentavos" DESC LIMIT 5`),
    ]);

    return {
        periodo,
        receitaCentavos: vendas.receita,
        despesasCentavos: despesas.total,
        saldoCentavos: vendas.receita - despesas.total,
        taxaServicoCentavos: vendas.taxa,
        totalRecebidoCentavos: vendas.receita + vendas.taxa,
        pedidosPagos: vendas.pedidos,
        ticketMedioCentavos: vendas.pedidos ? Math.round(vendas.receita / vendas.pedidos) : 0,
        compras: despesas.compras,
        porGarcom: porGarcom.map((g) => ({
            garcomId: g.garcomId,
            nome: g.garcomId ? `${g.nome} ${g.sobrenome}` : 'Aguardando check-in',
            pedidos: g.pedidos,
            taxaServicoCentavos: g.taxaServicoCentavos,
        })),
        porFormaPagamento,
        maisVendidos,
    };
}
