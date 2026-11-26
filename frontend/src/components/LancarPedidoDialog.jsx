import { useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack,
  TextField, Typography, useMediaQuery,
} from '@mui/material';
import { listarCardapio, listarMesas } from '../api/cardapio.js';
import { lancarPedido } from '../api/pedidos.js';
import { useApi } from '../hooks/useApi.js';
import { paraItens } from '../utils/formatos.js';
import SeletorItens from './SeletorItens.jsx';

const carregarDados = () => Promise.all([listarMesas({ ativa: true }), listarCardapio()]);

// O garçom escolhe a mesa e os itens. Quem lança o pedido é o garçom que recebe os 10%.
export default function LancarPedidoDialog({ onFechar, onConcluir }) {
  const telaPequena = useMediaQuery((t) => t.breakpoints.down('sm'));
  const { dados, erro: erroCarga, carregando } = useApi(carregarDados); // função de módulo: referência estável
  const [mesas, produtos] = dados ?? [[], []];
  const [mesaId, setMesaId] = useState('');
  const [quantidades, setQuantidades] = useState({});
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const itens = paraItens(quantidades);

  async function lancar() {
    setErro('');
    setEnviando(true);
    try {
      const pedido = await lancarPedido({ mesaId, itens, observacao });
      onConcluir(pedido);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onFechar} fullScreen={telaPequena} maxWidth="sm" fullWidth>
      <DialogTitle>Lançar pedido</DialogTitle>
      <DialogContent dividers>
        {erroCarga && <Alert severity="error">{erroCarga.message}</Alert>}
        {carregando && <LinearProgress />}
        {dados && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Mesa</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {mesas.map((m) => (
                  <Chip
                    key={m.id}
                    label={m.numero}
                    onClick={() => setMesaId(m.id)}
                    color={mesaId === m.id ? 'primary' : 'default'}
                    variant={mesaId === m.id ? 'filled' : 'outlined'}
                    aria-label={`Mesa ${m.numero}`}
                    sx={{ minWidth: 48, fontSize: 16 }}
                  />
                ))}
              </Stack>
            </Box>
            <SeletorItens produtos={produtos} quantidades={quantidades} onChange={setQuantidades} />
            <TextField
              label="Observação para a cozinha (opcional)"
              placeholder="Sem cebola, ponto da carne..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            {erro && <Alert severity="error">{erro}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" disabled={!mesaId || !itens.length} loading={enviando} onClick={lancar}>
          Lançar pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
