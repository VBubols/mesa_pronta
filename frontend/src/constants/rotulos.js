// Rótulos dos códigos que a API devolve ('em_preparo' -> 'Em preparo').
// A ordem de cada grupo é a mesma de backend/src/constants. Mudou lá, muda aqui.

export const ROTULOS = {
  perfis: { admin: 'Admin', funcionario: 'Funcionário', cliente: 'Cliente' },
  categorias: {
    entrada: 'Entradas',
    prato_principal: 'Pratos principais',
    sobremesa: 'Sobremesas',
    bebida: 'Bebidas',
  },
  statusReserva: {
    confirmada: 'Confirmada',
    em_atendimento: 'Em atendimento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  },
  statusPedido: {
    agendado: 'Aguardando check-in',
    aberto: 'Aberto',
    em_preparo: 'Em preparo',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  },
  formasPagamento: { pix: 'Pix', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' },
  origens: { local: 'Na mesa', antecipado: 'Antecipado' },
};

// Cor do Chip de cada status
export const CORES_STATUS = {
  statusReserva: { confirmada: 'primary', em_atendimento: 'secondary', concluida: 'default', cancelada: 'error' },
  statusPedido: { agendado: 'info', aberto: 'default', em_preparo: 'secondary', entregue: 'primary', cancelado: 'error' },
};

export function rotulo(grupo, valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return ROTULOS[grupo]?.[valor] ?? valor;
}

// Para Select: [{ valor: 'pix', rotulo: 'Pix' }, ...]
export function opcoes(grupo) {
  return Object.entries(ROTULOS[grupo] ?? {}).map(([valor, texto]) => ({ valor, rotulo: texto }));
}
