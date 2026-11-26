// Regras e valores fixos do restaurante. Mudou alguma regra da casa? É aqui.

// O restaurante recebe reservas só de sexta a domingo (valores de Date.getDay()).
export const DIAS_RESERVA = [5, 6, 0];
export const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Horários fixos: conflito de reserva é só mesma mesa, data e horário, sem calcular sobreposição.
export const HORARIOS_RESERVA = ['12:00', '13:30', '19:00', '20:30', '22:00'];

// Fuso usado para "hoje" e "agora". O servidor pode rodar em UTC (Vercel, Render).
export const FUSO = 'America/Sao_Paulo';

// Taxa de serviço (os "10% do garçom"). Não é receita do restaurante: é repassada ao garçom.
export const TAXA_SERVICO = 0.1;

export const CATEGORIAS_PRODUTO = ['entrada', 'prato_principal', 'sobremesa', 'bebida'];

// confirmada -> em_atendimento (check-in) -> concluida; confirmada -> cancelada
export const STATUS_RESERVA = ['confirmada', 'em_atendimento', 'concluida', 'cancelada'];

// local: lançado pelo garçom na mesa. antecipado: comprado pelo cliente junto com a reserva.
export const ORIGENS_PEDIDO = ['local', 'antecipado'];

// agendado: compra antecipada esperando o check-in da reserva.
// aberto -> em_preparo -> entregue. O pagamento é separado do status (campo pagoEm).
export const STATUS_PEDIDO = ['agendado', 'aberto', 'em_preparo', 'entregue', 'cancelado'];

// Transições que o funcionário faz pela rota de status. Check-in e cancelamento têm rotas próprias.
export const PROXIMO_STATUS_PEDIDO = {
  aberto: 'em_preparo',
  em_preparo: 'entregue',
};

// Pagamento simulado: o sistema registra a forma, não processa cobrança.
export const FORMAS_PAGAMENTO = ['pix', 'credito', 'debito', 'dinheiro'];

export const LIMITES = {
  itensPorPedido: 30,
  quantidadePorItem: 50,
  pessoasPorReserva: 20,
};
