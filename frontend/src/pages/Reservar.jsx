import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, IconButton, LinearProgress, Paper, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { criarReserva, disponibilidade } from '../api/reservas.js';
import { errosPorCampo } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { dataCurta, dataLonga, proximosFinsDeSemana } from '../utils/formatos.js';

const MAX_PESSOAS = 20;

function Passo({ titulo, children }) {
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>{titulo}</Typography>
      {children}
    </Box>
  );
}

export default function Reservar() {
  const navigate = useNavigate();
  const [datas] = useState(() => proximosFinsDeSemana(6));
  const [pessoas, setPessoas] = useState(2);
  const [data, setData] = useState(datas[0]);
  const [horario, setHorario] = useState(null);
  const [mesaId, setMesaId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => disponibilidade({ data, pessoas }), [data, pessoas]);
  const { dados: horarios, erro: erroDisponibilidade, carregando } = useApi(carregar);
  const mesasLivres = horarios?.find((h) => h.horario === horario)?.mesas ?? [];

  // Trocar dia ou tamanho do grupo pode tirar a mesa e o horário escolhidos de circulação
  const escolherData = (nova) => { setData(nova); setHorario(null); setMesaId(''); };
  const mudarPessoas = (delta) => {
    setPessoas((p) => Math.min(MAX_PESSOAS, Math.max(1, p + delta)));
    setHorario(null);
    setMesaId('');
  };

  async function confirmar() {
    setErro('');
    setEnviando(true);
    try {
      const reserva = await criarReserva({ data, horario, pessoas, mesaId: mesaId || undefined, observacao });
      navigate('/minhas-reservas', { state: { reservada: reserva.id } });
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErro(Object.values(porCampo)[0] ?? e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 34, sm: 44 } }}>Reservar mesa</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Atendemos com reserva de sexta a domingo. Escolha o tamanho do grupo, o dia e o horário.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={4}>
          <Passo titulo="Quantas pessoas?">
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <IconButton aria-label="Uma pessoa a menos" onClick={() => mudarPessoas(-1)} disabled={pessoas <= 1}>
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ fontSize: 28, fontWeight: 800, minWidth: 40, textAlign: 'center' }} aria-live="polite">
                {pessoas}
              </Typography>
              <IconButton aria-label="Uma pessoa a mais" onClick={() => mudarPessoas(1)} disabled={pessoas >= MAX_PESSOAS}>
                <AddIcon />
              </IconButton>
            </Stack>
          </Passo>

          <Passo titulo="Que dia?">
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {datas.map((d) => (
                <Chip
                  key={d}
                  label={dataCurta(d)}
                  onClick={() => escolherData(d)}
                  color={d === data ? 'primary' : 'default'}
                  variant={d === data ? 'filled' : 'outlined'}
                  sx={{ px: 0.5 }}
                />
              ))}
            </Stack>
          </Passo>

          <Passo titulo="Qual horário?">
            {erroDisponibilidade && <Alert severity="error">{erroDisponibilidade.message}</Alert>}
            {carregando && <LinearProgress sx={{ mb: 1 }} />}
            {horarios?.length === 0 && (
              <Typography color="text.secondary">Os horários deste dia já passaram. Escolha outro dia.</Typography>
            )}
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {horarios?.map(({ horario: h, mesas }) => (
                <Button
                  key={h}
                  variant={h === horario ? 'contained' : 'outlined'}
                  disabled={!mesas.length}
                  onClick={() => { setHorario(h); setMesaId(''); }}
                  sx={{ flexDirection: 'column', minWidth: 104, py: 1 }}
                >
                  <Box component="span" sx={{ fontSize: 18, fontWeight: 800 }}>{h}</Box>
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 400 }}>
                    {mesas.length ? `${mesas.length} ${mesas.length === 1 ? 'mesa livre' : 'mesas livres'}` : 'Lotado'}
                  </Box>
                </Button>
              ))}
            </Stack>
          </Passo>

          {horario && (
            <Passo titulo="Mesa">
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="Tanto faz"
                  onClick={() => setMesaId('')}
                  color={!mesaId ? 'primary' : 'default'}
                  variant={!mesaId ? 'filled' : 'outlined'}
                />
                {mesasLivres.map((m) => (
                  <Chip
                    key={m.id}
                    label={`Mesa ${m.numero} (${m.capacidade} lugares)`}
                    onClick={() => setMesaId(m.id)}
                    color={mesaId === m.id ? 'primary' : 'default'}
                    variant={mesaId === m.id ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
              <TextField
                label="Observação (opcional)"
                placeholder="Aniversário, cadeirinha de bebê, restrição alimentar..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                fullWidth
                sx={{ mt: 3 }}
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />
            </Passo>
          )}
        </Stack>
      </Paper>

      {erro && <Alert severity="error">{erro}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 18 }}>
          {horario
            ? <><b>{dataLonga(data)}</b>, às <b>{horario}</b>, para <b>{pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}</b></>
            : 'Escolha um horário para continuar.'}
        </Typography>
        <Button variant="contained" size="large" disabled={!horario} loading={enviando} onClick={confirmar}>
          Confirmar reserva
        </Button>
      </Stack>
    </Stack>
  );
}
