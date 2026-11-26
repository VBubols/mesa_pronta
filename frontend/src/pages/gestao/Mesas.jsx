import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Paper, Stack,
  Switch, TextField, Typography,
} from '@mui/material';
import { atualizarMesa, criarMesa, listarMesas } from '../../api/cardapio.js';
import { errosPorCampo } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAviso } from '../../hooks/useAviso.jsx';

function FormMesa({ mesa, sugestao, onFechar, onSalvo }) {
  const [numero, setNumero] = useState(String(mesa?.numero ?? sugestao));
  const [capacidade, setCapacidade] = useState(String(mesa?.capacidade ?? 4));
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setErros({});
    setErro('');
    setEnviando(true);
    try {
      const dados = { numero: Number(numero), capacidade: Number(capacidade) };
      const salva = mesa ? await atualizarMesa(mesa.id, dados) : await criarMesa(dados);
      onSalvo(salva);
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErros(porCampo);
      setErro(Object.keys(porCampo).length ? '' : e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onFechar} maxWidth="xs" fullWidth>
      <DialogTitle>{mesa ? `Editar mesa ${mesa.numero}` : 'Nova mesa'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField label="Número" type="number" value={numero} onChange={(e) => setNumero(e.target.value)}
            error={Boolean(erros.numero)} helperText={erros.numero} slotProps={{ htmlInput: { min: 1, max: 999 } }} autoFocus />
          <TextField label="Lugares" type="number" value={capacidade} onChange={(e) => setCapacidade(e.target.value)}
            error={Boolean(erros.capacidade)} helperText={erros.capacidade ?? 'Define o tamanho de grupo que a mesa aceita nas reservas'}
            slotProps={{ htmlInput: { min: 1, max: 20 } }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" loading={enviando} onClick={salvar}>{mesa ? 'Salvar alterações' : 'Cadastrar mesa'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Mesas() {
  const { dados, erro, carregando, recarregar } = useApi(useCallback(() => listarMesas(), []));
  const [editando, setEditando] = useState(null);
  const { aviso, avisar } = useAviso();

  async function alternar(mesa) {
    try {
      await atualizarMesa(mesa.id, { ativa: !mesa.ativa });
      avisar(mesa.ativa ? `Mesa ${mesa.numero} fora de uso.` : `Mesa ${mesa.numero} de volta ao salão.`);
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  const lugares = (dados ?? []).filter((m) => m.ativa).reduce((s, m) => s + m.capacidade, 0);
  const proximoNumero = Math.max(0, ...(dados ?? []).map((m) => m.numero)) + 1;

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Mesas</Typography>
          <Typography color="text.secondary">
            {dados ? `${lugares} lugares nas mesas em uso. Mesa fora de uso não recebe reservas nem pedidos.` : ' '}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditando({})}>Nova mesa</Button>
      </Stack>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
        {dados?.map((m) => (
          <Paper key={m.id} variant="outlined" sx={{ p: 2, opacity: m.ativa ? 1 : 0.6 }}>
            <Typography sx={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
              {m.numero}
            </Typography>
            <Typography color="text.secondary">{m.capacidade} lugares</Typography>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Switch checked={m.ativa} onChange={() => alternar(m)} slotProps={{ input: { 'aria-label': `Mesa ${m.numero} em uso` } }} />
              <Button size="small" onClick={() => setEditando(m)}>Editar</Button>
            </Stack>
          </Paper>
        ))}
      </Box>
      {dados?.length === 0 && <Typography color="text.secondary">Cadastre as mesas do salão para abrir as reservas.</Typography>}

      {editando && (
        <FormMesa
          mesa={editando.id ? editando : null}
          sugestao={proximoNumero}
          onFechar={() => setEditando(null)}
          onSalvo={(m) => { setEditando(null); avisar(`Mesa ${m.numero} salva.`); recarregar(); }}
        />
      )}
      {aviso}
    </Stack>
  );
}
