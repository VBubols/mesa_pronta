import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, FormControlLabel, LinearProgress, Radio, RadioGroup, Stack, Typography,
} from '@mui/material';
import { avancarPedido, cancelarPedido, listarPedidos, registrarPagamento } from '../../api/pedidos.js';
import { useApi } from '../../hooks/useApi.js';
import { useAviso } from '../../hooks/useAviso.jsx';
import { opcoes, rotulo } from '../../constants/rotulos.js';
import { hora, reais } from '../../utils/formatos.js';
import Comanda from '../../components/Comanda.jsx';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';
import LancarPedidoDialog from '../../components/LancarPedidoDialog.jsx';

const FUNDO_COLUNA = '#E1E8E3';
const ATUALIZAR_A_CADA_MS = 15_000;

// O quadro do salão: cada coluna é uma etapa do pedido.
const COLUNAS = [
  { chave: 'aberto', titulo: 'Novos', vazio: 'Nenhum pedido esperando a cozinha.' },
  { chave: 'em_preparo', titulo: 'Na cozinha', vazio: 'A cozinha está livre.' },
  { chave: 'entregue', titulo: 'Na mesa, a pagar', vazio: 'Nenhuma conta em aberto.' },
];

const carregarQuadro = async () => {
  const [aberto, emPreparo, entregue] = await Promise.all([
    listarPedidos({ status: 'aberto' }),
    listarPedidos({ status: 'em_preparo' }),
    listarPedidos({ status: 'entregue', pago: false }),
  ]);
  // Mais antigo primeiro: é o que está esperando há mais tempo
  const ordenar = (lista) => [...lista].reverse();
  return { aberto: ordenar(aberto), em_preparo: ordenar(emPreparo), entregue: ordenar(entregue), em: new Date().toISOString() };
};

export default function Pedidos() {
  const { dados, erro, carregando, recarregar } = useApi(carregarQuadro); // função de módulo: referência estável
  const [lancando, setLancando] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const [pagando, setPagando] = useState(null);
  const [forma, setForma] = useState('pix');
  const [ocupado, setOcupado] = useState(null);
  const { aviso, avisar } = useAviso();

  // O quadro se atualiza sozinho: outro garçom pode ter lançado ou avançado pedidos.
  useEffect(() => {
    const id = setInterval(recarregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(id);
  }, [recarregar]);

  async function executar(pedidoId, acao, mensagem) {
    setOcupado(pedidoId);
    try {
      await acao();
      avisar(mensagem);
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(null);
      setCancelando(null);
      setPagando(null);
    }
  }

  const acoes = (p) => {
    const travado = ocupado === p.id;
    const cancelar = (
      <Button size="small" color="error" disabled={travado} onClick={() => setCancelando(p)}>Cancelar</Button>
    );
    if (p.status === 'aberto') {
      return (
        <>
          {cancelar}
          <Button size="small" variant="contained" loading={travado}
            onClick={() => executar(p.id, () => avancarPedido(p.id, 'em_preparo'), `Mesa ${p.mesa.numero}: pedido na cozinha.`)}>
            Iniciar preparo
          </Button>
        </>
      );
    }
    if (p.status === 'em_preparo') {
      return (
        <>
          {cancelar}
          <Button size="small" variant="contained" loading={travado}
            onClick={() => executar(p.id, () => avancarPedido(p.id, 'entregue'), `Mesa ${p.mesa.numero}: pedido entregue.`)}>
            Marcar como entregue
          </Button>
        </>
      );
    }
    if (p.pago) return null; // antecipado entregue: já está pago
    return (
      <Button size="small" variant="contained" color="secondary" onClick={() => { setForma('pix'); setPagando(p); }}>
        Registrar pagamento
      </Button>
    );
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Pedidos</Typography>
          <Typography color="text.secondary">
            {dados ? `Atualizado às ${hora(dados.em)}. O quadro se atualiza sozinho.` : 'Carregando o salão...'}
          </Typography>
        </Box>
        <Button variant="contained" size="large" onClick={() => setLancando(true)}>Lançar pedido</Button>
      </Stack>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && !dados && <LinearProgress />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, alignItems: 'start' }}>
        {COLUNAS.map((coluna) => {
          const pedidos = dados?.[coluna.chave] ?? [];
          return (
            <Box key={coluna.chave} component="section" aria-label={coluna.titulo}
              sx={{ bgcolor: FUNDO_COLUNA, borderRadius: 2, p: 1.5, minHeight: { md: 320 } }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', px: 0.5, mb: 1.5 }}>
                <Typography variant="h6" component="h2">{coluna.titulo}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 20 }} aria-label={`${pedidos.length} pedidos`}>{pedidos.length}</Typography>
              </Stack>
              <Stack spacing={2}>
                {pedidos.map((p) => <Comanda key={p.id} pedido={p} furos={FUNDO_COLUNA} acoes={acoes(p)} />)}
                {dados && !pedidos.length && (
                  <Typography color="text.secondary" sx={{ px: 0.5, py: 2 }}>{coluna.vazio}</Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {lancando && (
        <LancarPedidoDialog
          onFechar={() => setLancando(false)}
          onConcluir={(p) => { setLancando(false); avisar(`Pedido da mesa ${p.mesa.numero} lançado.`); recarregar(); }}
        />
      )}

      <ConfirmarDialog
        aberto={Boolean(cancelando)}
        titulo={`Cancelar o pedido da mesa ${cancelando?.mesa.numero}?`}
        texto={cancelando?.pago
          ? 'O pedido sai da cozinha. Ele foi pago antecipadamente, então o valor é estornado e sai do financeiro.'
          : 'O pedido sai da cozinha e não entra no financeiro.'}
        textoConfirmar="Cancelar pedido"
        perigoso
        carregando={ocupado === cancelando?.id}
        onConfirmar={() => executar(cancelando.id, () => cancelarPedido(cancelando.id), 'Pedido cancelado.')}
        onCancelar={() => setCancelando(null)}
      />

      <ConfirmarDialog
        aberto={Boolean(pagando)}
        titulo={`Pagamento da mesa ${pagando?.mesa.numero}`}
        texto={pagando && `Subtotal ${reais(pagando.subtotalCentavos)} mais ${reais(pagando.taxaServicoCentavos)} de serviço: total de ${reais(pagando.totalCentavos)}.`}
        textoConfirmar="Registrar pagamento"
        carregando={ocupado === pagando?.id}
        onConfirmar={() => executar(pagando.id, () => registrarPagamento(pagando.id, forma),
          `Mesa ${pagando.mesa.numero}: pago no ${rotulo('formasPagamento', forma).toLowerCase()}.`)}
        onCancelar={() => setPagando(null)}
      >
        <RadioGroup row value={forma} onChange={(e) => setForma(e.target.value)} sx={{ mt: 2 }}>
          {opcoes('formasPagamento').map((o) => (
            <FormControlLabel key={o.valor} value={o.valor} control={<Radio />} label={o.rotulo} />
          ))}
        </RadioGroup>
      </ConfirmarDialog>
      {aviso}
    </Stack>
  );
}
