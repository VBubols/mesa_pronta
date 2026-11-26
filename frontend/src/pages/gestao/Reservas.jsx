import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Chip, LinearProgress, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { listarUsuarios } from '../../api/admin.js';
import { cancelarReserva, checkIn, concluirReserva, listarReservas } from '../../api/reservas.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useAviso } from '../../hooks/useAviso.jsx';
import {
  dataCurta, dataLonga, hoje, mascaraTelefone, nomeCompleto, proximosFinsDeSemana, reais,
} from '../../utils/formatos.js';
import ChipStatus from '../../components/ChipStatus.jsx';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';
import EstadoVazio from '../../components/EstadoVazio.jsx';

const antecipadoAtivo = (r) => r.pedidos?.find((p) => p.origem === 'antecipado' && p.status !== 'cancelado');

function LinhaReserva({ reserva, onCheckIn, onConcluir, onCancelar, ocupado }) {
  const antecipado = antecipadoAtivo(reserva);
  const encerrada = ['cancelada', 'concluida'].includes(reserva.status);
  return (
    <Paper variant="outlined" sx={{ p: 2, opacity: encerrada ? 0.6 : 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
        <Box sx={{ minWidth: 92 }}>
          <Typography sx={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>
            Mesa {reserva.mesa?.numero}
          </Typography>
          <Typography variant="body2" color="text.secondary">{reserva.pessoas} {reserva.pessoas === 1 ? 'pessoa' : 'pessoas'}</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>{nomeCompleto(reserva.cliente)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {reserva.cliente?.telefoneCelular && (
              <a href={`tel:${reserva.cliente.telefoneCelular}`} style={{ color: 'inherit' }}>
                {mascaraTelefone(reserva.cliente.telefoneCelular)}
              </a>
            )}
            {reserva.garcom && `${reserva.cliente?.telefoneCelular ? ', ' : ''}garçom ${nomeCompleto(reserva.garcom)}`}
          </Typography>
          {reserva.observacao && <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>{reserva.observacao}</Typography>}
        </Box>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {antecipado && (
            <Tooltip title={antecipado.itens.map((i) => `${i.quantidade}× ${i.nomeProduto}`).join(', ')}>
              <Chip size="small" color="info" variant="outlined" label={`Antecipado ${reais(antecipado.totalCentavos)}, pago`} />
            </Tooltip>
          )}
          <ChipStatus grupo="statusReserva" valor={reserva.status} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', minWidth: { md: 260 } }}>
          {reserva.status === 'confirmada' && (
            <>
              <Button size="small" color="error" disabled={ocupado} onClick={() => onCancelar(reserva)}>Cancelar</Button>
              <Button size="small" variant="contained" disabled={ocupado} onClick={() => onCheckIn(reserva)}>Fazer check-in</Button>
            </>
          )}
          {reserva.status === 'em_atendimento' && (
            <Button size="small" variant="outlined" loading={ocupado} onClick={() => onConcluir(reserva)}>Encerrar atendimento</Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function Reservas() {
  const { usuario, ehAdmin } = useAuth();
  const [dias] = useState(() => [...new Set([hoje(), ...proximosFinsDeSemana(6)])]);
  const [data, setData] = useState(dias[0]);
  const { dados, erro, carregando, recarregar } = useApi(useCallback(() => listarReservas({ data }), [data]));
  // O admin escolhe o garçom no check-in; o funcionário é o garçom da mesa que recebe.
  const { dados: garcons } = useApi(useCallback(
    () => (ehAdmin ? listarUsuarios({ role: 'funcionario', limite: 100 }) : Promise.resolve(null)),
    [ehAdmin],
  ));
  const [checkInDe, setCheckInDe] = useState(null);
  const [garcomId, setGarcomId] = useState('');
  const [cancelando, setCancelando] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const { aviso, avisar } = useAviso();

  async function executar(id, acao, mensagem) {
    setOcupado(id);
    try {
      await acao();
      avisar(mensagem);
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(null);
      setCheckInDe(null);
      setCancelando(null);
    }
  }

  const porHorario = Object.entries(
    (dados ?? []).reduce((grupos, r) => ({ ...grupos, [r.horario]: [...(grupos[r.horario] ?? []), r] }), {}),
  );
  const ativas = (dados ?? []).filter((r) => r.status !== 'cancelada');
  const garconsAtivos = garcons?.dados.filter((g) => g.ativo) ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">Reservas</Typography>
        <Typography color="text.secondary">
          No check-in a mesa ganha o garçom, e a compra antecipada vai para a cozinha.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {dias.map((d) => (
            <Chip key={d} label={d === hoje() ? 'Hoje' : dataCurta(d)} onClick={() => setData(d)}
              color={d === data ? 'primary' : 'default'} variant={d === data ? 'filled' : 'outlined'} />
          ))}
        </Stack>
        <TextField type="date" size="small" label="Outra data" value={data} onChange={(e) => e.target.value && setData(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 170 }} />
      </Stack>

      <Typography variant="h6" component="h2">
        {dataLonga(data)}
        {dados && <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
          {ativas.length} {ativas.length === 1 ? 'reserva' : 'reservas'}, {ativas.reduce((s, r) => s + r.pessoas, 0)} pessoas
        </Typography>}
      </Typography>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados?.length === 0 && (
        <EstadoVazio titulo="Nenhuma reserva neste dia" texto="As reservas abrem de sexta a domingo. Escolha outro dia acima." />
      )}

      {porHorario.map(([horario, reservas]) => (
        <Box key={horario} component="section" aria-label={`Reservas das ${horario}`}>
          <Typography variant="h5" component="h3" sx={{ mb: 1 }}>{horario}</Typography>
          <Stack spacing={1}>
            {reservas.map((r) => (
              <LinhaReserva
                key={r.id}
                reserva={r}
                ocupado={ocupado === r.id}
                onCheckIn={(res) => { setGarcomId(''); setCheckInDe(res); }}
                onCancelar={setCancelando}
                onConcluir={(res) => executar(res.id, () => concluirReserva(res.id), `Atendimento da mesa ${res.mesa.numero} encerrado.`)}
              />
            ))}
          </Stack>
        </Box>
      ))}

      <ConfirmarDialog
        aberto={Boolean(checkInDe)}
        titulo={`Check-in da mesa ${checkInDe?.mesa.numero}`}
        texto={ehAdmin
          ? 'Escolha o garçom que vai atender a mesa. Ele recebe os 10% dos pedidos dela.'
          : `Você, ${usuario?.nome}, vai atender a mesa e receber os 10% dos pedidos dela.`}
        textoConfirmar="Fazer check-in"
        carregando={ocupado === checkInDe?.id}
        desabilitado={ehAdmin && !garcomId}
        onConfirmar={() => executar(checkInDe.id, () => checkIn(checkInDe.id, garcomId || undefined), `Mesa ${checkInDe.mesa.numero} em atendimento.`)}
        onCancelar={() => setCheckInDe(null)}
      >
        {ehAdmin && (
          <TextField select fullWidth label="Garçom" value={garcomId} onChange={(e) => setGarcomId(e.target.value)} sx={{ mt: 2 }}
            helperText={garconsAtivos.length ? '' : 'Cadastre um funcionário em Equipe e clientes.'}>
            {garconsAtivos.map((g) => <MenuItem key={g.id} value={g.id}>{nomeCompleto(g)}</MenuItem>)}
          </TextField>
        )}
      </ConfirmarDialog>

      <ConfirmarDialog
        aberto={Boolean(cancelando)}
        titulo={`Cancelar a reserva de ${cancelando?.cliente?.nome}?`}
        texto="A mesa fica livre. Se houver compra antecipada, ela é cancelada e estornada."
        textoConfirmar="Cancelar reserva"
        perigoso
        carregando={ocupado === cancelando?.id}
        onConfirmar={() => executar(cancelando.id, () => cancelarReserva(cancelando.id), 'Reserva cancelada.')}
        onCancelar={() => setCancelando(null)}
      />
      {aviso}
    </Stack>
  );
}
