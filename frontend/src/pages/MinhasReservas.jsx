import { useCallback, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Alert, Box, Button, Divider, LinearProgress, Paper, Stack, Typography,
} from '@mui/material';
import EventSeatIcon from '@mui/icons-material/EventSeatOutlined';
import { cancelarReserva, minhasReservas } from '../api/reservas.js';
import { useApi } from '../hooks/useApi.js';
import { useAviso } from '../hooks/useAviso.jsx';
import { rotulo } from '../constants/rotulos.js';
import { dataHora, dataLonga, ehFuturo, reais } from '../utils/formatos.js';
import ChipStatus from '../components/ChipStatus.jsx';
import ConfirmarDialog from '../components/ConfirmarDialog.jsx';
import EstadoVazio from '../components/EstadoVazio.jsx';
import CompraAntecipadaDialog from '../components/CompraAntecipadaDialog.jsx';

const antecipadoAtivo = (reserva) => reserva.pedidos?.find((p) => p.origem === 'antecipado' && p.status !== 'cancelado');

function Reserva({ reserva, onAdiantar, onCancelar }) {
  const aberta = reserva.status === 'confirmada' && ehFuturo(reserva.data, reserva.horario);
  const antecipado = antecipadoAtivo(reserva);
  const encerrada = ['cancelada', 'concluida'].includes(reserva.status);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, opacity: encerrada ? 0.7 : 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h2">{dataLonga(reserva.data)}</Typography>
          <Typography sx={{ fontSize: 18, mt: 0.5 }}>
            {reserva.horario}, mesa {reserva.mesa?.numero}, {reserva.pessoas} {reserva.pessoas === 1 ? 'pessoa' : 'pessoas'}
          </Typography>
          {reserva.observacao && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{reserva.observacao}</Typography>}
        </Box>
        <Box><ChipStatus grupo="statusReserva" valor={reserva.status} /></Box>
      </Stack>

      {antecipado && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">
            Pedido antecipado, pago no {rotulo('formasPagamento', antecipado.formaPagamento).toLowerCase()} em {dataHora(antecipado.pagoEm)}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
            {antecipado.itens.map((i) => (
              <li key={i.id}>{i.quantidade}× {i.nomeProduto}</li>
            ))}
          </Box>
          <Typography sx={{ mt: 1, fontWeight: 700 }}>Total com os 10%: {reais(antecipado.totalCentavos)}</Typography>
        </>
      )}

      {aberta && (
        <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}>
          {!antecipado && <Button variant="contained" onClick={() => onAdiantar(reserva)}>Adiantar o pedido</Button>}
          <Button color="error" onClick={() => onCancelar(reserva)}>Cancelar reserva</Button>
        </Stack>
      )}
    </Paper>
  );
}

export default function MinhasReservas() {
  const location = useLocation();
  const [recemCriada] = useState(location.state?.reservada);
  const { dados, erro, carregando, recarregar } = useApi(useCallback(() => minhasReservas(), []));
  const [adiantando, setAdiantando] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const { aviso, avisar } = useAviso();

  async function cancelar() {
    setOcupado(true);
    try {
      await cancelarReserva(cancelando.id);
      avisar('Reserva cancelada.');
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
      setCancelando(null);
    }
  }

  const proximas = dados?.filter((r) => ['confirmada', 'em_atendimento'].includes(r.status)) ?? [];
  const anteriores = dados?.filter((r) => !proximas.includes(r)) ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 34, sm: 44 } }}>Minhas reservas</Typography>
        <Button component={RouterLink} to="/reservar" variant="outlined">Nova reserva</Button>
      </Stack>

      {recemCriada && !antecipadoAtivo(dados?.find((r) => r.id === recemCriada) ?? {}) && (
        <Alert severity="success">
          Reserva confirmada. Se quiser, adiante o pedido agora: ele vai para a cozinha assim que você chegar.
        </Alert>
      )}
      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados?.length === 0 && (
        <EstadoVazio
          icone={<EventSeatIcon color="primary" sx={{ fontSize: 40 }} />}
          titulo="Nenhuma reserva ainda"
          texto="Abrimos de sexta a domingo, no almoço e no jantar."
          acao={<Button component={RouterLink} to="/reservar" variant="contained">Reservar mesa</Button>}
        />
      )}

      {proximas.map((r) => (
        <Reserva key={r.id} reserva={r} onAdiantar={setAdiantando} onCancelar={setCancelando} />
      ))}

      {anteriores.length > 0 && (
        <>
          <Typography variant="h6" component="h2" sx={{ pt: 2 }}>Anteriores e canceladas</Typography>
          {anteriores.map((r) => <Reserva key={r.id} reserva={r} />)}
        </>
      )}

      {adiantando && (
        <CompraAntecipadaDialog
          reserva={adiantando}
          onFechar={() => setAdiantando(null)}
          onConcluir={() => { setAdiantando(null); avisar('Pedido pago. Ele vai para a cozinha no seu check-in.'); recarregar(); }}
        />
      )}

      <ConfirmarDialog
        aberto={Boolean(cancelando)}
        titulo="Cancelar a reserva?"
        texto={antecipadoAtivo(cancelando ?? {})
          ? 'A mesa fica livre para outra pessoa e o pedido antecipado é cancelado, com o valor estornado.'
          : 'A mesa fica livre para outra pessoa.'}
        textoConfirmar="Cancelar reserva"
        perigoso
        carregando={ocupado}
        onConfirmar={cancelar}
        onCancelar={() => setCancelando(null)}
      />
      {aviso}
    </Stack>
  );
}
