import { Op } from 'sequelize';
import { Mesa, Reserva, Usuario } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { ehFuturo } from '../utils/regras.js';
import { DIAS_RESERVA, HORARIOS_RESERVA, NOMES_DIAS } from '../constants/restaurante.js';

const ehGestao = (usuario) => usuario.role === 'funcionario' || usuario.role === 'admin';

// O que vem junto de cada reserva nas respostas.
const detalhes = () => [
    { model: Mesa, as: 'mesa', attributes: ['id', 'numero', 'capacidade'] },
    { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'sobrenome', 'email', 'telefoneCelular'] },
    { model: Usuario, as: 'garcom', attributes: ['id', 'nome', 'sobrenome'] },
];

async function buscar(id, opcoes = {}) {
    const reserva = await Reserva.findByPk(id, { include: detalhes(), ...opcoes });
    if (!reserva) throw new AppError(404, 'Reserva não encontrada');
    return reserva;
}

// Cliente só enxerga as próprias reservas. Para ele, a dos outros "não existe" (404).
function garantirAcesso(reserva, usuario) {
    if (!ehGestao(usuario) && reserva.clienteId !== usuario.id) {
        throw new AppError(404, 'Reserva não encontrada');
    }
}

export function opcoes() {
    return {
        dias: DIAS_RESERVA.map((dia) => ({ dia, nome: NOMES_DIAS[dia] })),
        horarios: HORARIOS_RESERVA,
    };
}

// Mesas livres por horário. A primeira de cada lista é a menor mesa que comporta o grupo.
export async function disponibilidade({ data, pessoas, horario }) {
    const horarios = horario ? [horario] : HORARIOS_RESERVA.filter((h) => ehFuturo(data, h));

    const [mesas, ocupadas] = await Promise.all([
        Mesa.findAll({
            where: { ativa: true, capacidade: { [Op.gte]: pessoas } },
            attributes: ['id', 'numero', 'capacidade'],
            order: [['capacidade', 'ASC'], ['numero', 'ASC']],
        }),
        Reserva.findAll({
            where: { data, horario: horarios, status: { [Op.ne]: 'cancelada' } },
            attributes: ['mesaId', 'horario'],
        }),
    ]);

    const ocupada = new Set(ocupadas.map((r) => `${r.horario}|${r.mesaId}`));
    return horarios.map((h) => ({
        horario: h,
        mesas: mesas.filter((m) => !ocupada.has(`${h}|${m.id}`)),
    }));
}

export async function criar(clienteId, { data, horario, pessoas, mesaId, observacao }) {
    const repetida = await Reserva.findOne({
        where: { clienteId, data, horario, status: { [Op.ne]: 'cancelada' } },
    });
    if (repetida) throw new AppError(409, 'Você já tem uma reserva nesse dia e horário');

    let mesa;
    if (mesaId) {
        mesa = await Mesa.findByPk(mesaId);
        if (!mesa || !mesa.ativa) throw new AppError(404, 'Mesa não encontrada');
        if (mesa.capacidade < pessoas) {
            throw new AppError(409, `A mesa ${mesa.numero} comporta até ${mesa.capacidade} pessoas`);
        }
    } else {
        const [{ mesas }] = await disponibilidade({ data, pessoas, horario });
        if (!mesas.length) throw new AppError(409, `Não há mesa livre para ${pessoas} pessoas nesse horário`);
        [mesa] = mesas;
    }

    try {
        const reserva = await Reserva.create({
            data, horario, pessoas, observacao, clienteId, mesaId: mesa.id,
        });
        return buscar(reserva.id);
    } catch (erro) {
        // O índice único parcial do banco barra duas reservas ativas na mesma mesa e horário,
        // inclusive quando dois clientes confirmam ao mesmo tempo.
        if (erro.name === 'SequelizeUniqueConstraintError') {
            throw new AppError(409, `A mesa ${mesa.numero} já está reservada nesse horário`);
        }
        throw erro;
    }
}

export async function listarDoCliente(clienteId) {
    return Reserva.findAll({
        where: { clienteId },
        include: detalhes(),
        order: [['data', 'DESC'], ['horario', 'DESC']],
    });
}

export async function listar({ data, status }) {
    const where = {};
    if (data) where.data = data;
    if (status) where.status = status;
    return Reserva.findAll({
        where,
        include: detalhes(),
        order: [['data', 'ASC'], ['horario', 'ASC']],
        limit: 500,
    });
}

export async function obter(id, usuario) {
    const reserva = await buscar(id);
    garantirAcesso(reserva, usuario);
    return reserva;
}

export async function cancelar(id, usuario) {
    const reserva = await buscar(id);
    garantirAcesso(reserva, usuario);

    if (reserva.status !== 'confirmada') {
        throw new AppError(409, 'Só reservas confirmadas podem ser canceladas');
    }
    if (!ehGestao(usuario) && !ehFuturo(reserva.data, reserva.horario)) {
        throw new AppError(409, 'O horário da reserva já passou. Fale com o restaurante');
    }

    await reserva.update({ status: 'cancelada' });
    return buscar(id);
}

// Check-in: o cliente chegou. Define o garçom da mesa, que recebe os 10% do atendimento.
export async function checkIn(id, usuario, { garcomId }) {
    const reserva = await buscar(id);
    if (reserva.status !== 'confirmada') {
        throw new AppError(409, 'Só reservas confirmadas podem receber check-in');
    }

    const idGarcom = garcomId ?? (usuario.role === 'funcionario' ? usuario.id : null);
    if (!idGarcom) throw new AppError(400, 'Informe o garçom (garcomId) que vai atender a mesa');

    const garcom = await Usuario.findOne({ where: { id: idGarcom, role: 'funcionario', ativo: true } });
    if (!garcom) throw new AppError(400, 'O garçom precisa ser um funcionário ativo');

    await reserva.update({ status: 'em_atendimento', garcomId: garcom.id });
    return buscar(id);
}

export async function concluir(id) {
    const reserva = await buscar(id);
    if (reserva.status !== 'em_atendimento') {
        throw new AppError(409, 'Só reservas em atendimento podem ser concluídas');
    }
    await reserva.update({ status: 'concluida' });
    return buscar(id);
}
