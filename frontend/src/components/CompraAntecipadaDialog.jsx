import { useCallback, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress,
  Radio, RadioGroup, Stack, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { listarCardapio } from '../api/cardapio.js';
import { comprarAntecipado } from '../api/reservas.js';
import { useApi } from '../hooks/useApi.js';
import { opcoes } from '../constants/rotulos.js';
import { calcularValores, dataCurta, paraItens, reais } from '../utils/formatos.js';
import SeletorItens from './SeletorItens.jsx';

// O cliente escolhe do cardápio e paga antes de chegar. Os 10% já vão incluídos.
export default function CompraAntecipadaDialog({ reserva, onFechar, onConcluir }) {
  const telaPequena = useMediaQuery((t) => t.breakpoints.down('sm'));
  const { dados: produtos, erro: erroCardapio, carregando } = useApi(useCallback(() => listarCardapio(), []));
  const [quantidades, setQuantidades] = useState({});
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const itens = paraItens(quantidades);
  const { total } = calcularValores(
    (produtos ?? []).filter((p) => quantidades[p.id]).map((p) => ({ precoCentavos: p.precoCentavos, quantidade: quantidades[p.id] })),
  );

  async function pagar() {
    setErro('');
    setEnviando(true);
    try {
      await comprarAntecipado(reserva.id, { itens, formaPagamento, observacao });
      onConcluir();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onFechar} fullScreen={telaPequena} maxWidth="sm" fullWidth>
      <DialogTitle>Adiantar o pedido</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography color="text.secondary">
            Para a reserva de {dataCurta(reserva.data)} às {reserva.horario}. O pedido vai para a cozinha
            quando você chegar e fizer o check-in.
          </Typography>
          {erroCardapio && <Alert severity="error">{erroCardapio.message}</Alert>}
          {carregando && <LinearProgress />}
          {produtos && <SeletorItens produtos={produtos} quantidades={quantidades} onChange={setQuantidades} />}

          <Stack spacing={1}>
            <Typography variant="subtitle2">Forma de pagamento</Typography>
            <RadioGroup row value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
              {opcoes('formasPagamento').map((o) => (
                <FormControlLabel key={o.valor} value={o.valor} control={<Radio />} label={o.rotulo} />
              ))}
            </RadioGroup>
            <Typography variant="caption" color="text.secondary">
              Pagamento simulado: o sistema registra a forma escolhida e nenhuma cobrança é feita.
            </Typography>
          </Stack>

          <TextField
            label="Observação para a cozinha (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 255 } }}
          />
          {erro && <Alert severity="error">{erro}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" disabled={!itens.length} loading={enviando} onClick={pagar}>
          {itens.length ? `Pagar ${reais(total)}` : 'Escolha os itens'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
