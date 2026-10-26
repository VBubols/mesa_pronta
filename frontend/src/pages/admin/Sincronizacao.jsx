import { useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { sincronizarVagas } from '../../api/admin.js';

const CONTADORES = [
  ['criadas', 'novas'],
  ['atualizadas', 'atualizadas'],
  ['inalteradas', 'sem mudança'],
  ['inativadas', 'encerradas'],
  ['descartadas', 'descartadas'],
];

// Importa as vagas abertas dos repositórios do GitHub e mostra o resumo.
export default function Sincronizacao({ onConcluir }) {
  const [rodando, setRodando] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');

  async function sincronizar() {
    setRodando(true);
    setErro('');
    try {
      const resultado = await sincronizarVagas();
      setResumo(resultado);
      onConcluir?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setRodando(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h6" component="h2">Vagas do GitHub</Typography>
          <Typography variant="body2" color="text.secondary">
            Importa as vagas abertas dos repositórios da comunidade e encerra as que foram fechadas.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SyncIcon />} onClick={sincronizar} loading={rodando} sx={{ flexShrink: 0 }}>
          Sincronizar agora
        </Button>
      </Stack>

      {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}

      {resumo && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Alert severity={resumo.erros.length ? 'warning' : 'success'}>
            Sincronização concluída em {(resumo.duracaoMs / 1000).toFixed(1)} s.
          </Alert>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {CONTADORES.map(([chave, texto]) => (
              <Chip key={chave} label={`${resumo[chave]} ${texto}`} variant={resumo[chave] ? 'filled' : 'outlined'} />
            ))}
          </Stack>
          {resumo.erros.map((mensagem) => <Alert key={mensagem} severity="warning">{mensagem}</Alert>)}
          {resumo.skillsNaoEncontradas.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Labels de skill que não existem na tabela de skills (vale cadastrar no seed):
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {resumo.skillsNaoEncontradas.map((nome) => <Chip key={nome} size="small" variant="outlined" label={nome} />)}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
