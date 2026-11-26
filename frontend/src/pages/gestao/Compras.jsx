import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { atualizarCompra, criarCompra, listarCompras, removerCompra } from '../../api/financeiro.js';
import { errosPorCampo } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAviso } from '../../hooks/useAviso.jsx';
import {
  centavosParaTexto, dataBr, hoje, limitesDoMes, nomeCompleto, paraCentavos, reais,
} from '../../utils/formatos.js';
import CampoDinheiro from '../../components/CampoDinheiro.jsx';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';
import SeletorMes from '../../components/SeletorMes.jsx';

function FormCompra({ compra, onFechar, onSalva }) {
  const [form, setForm] = useState({
    descricao: compra?.descricao ?? '',
    fornecedor: compra?.fornecedor ?? '',
    valor: compra ? centavosParaTexto(compra.valorCentavos) : '',
    data: compra?.data ?? hoje(),
  });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function salvar() {
    const valorCentavos = paraCentavos(form.valor);
    if (valorCentavos === null) {
      setErros({ valorCentavos: 'Informe o valor, ex.: 480,00' });
      return;
    }
    setErros({});
    setErro('');
    setEnviando(true);
    try {
      const dados = { descricao: form.descricao, fornecedor: form.fornecedor, valorCentavos, data: form.data };
      const salva = compra ? await atualizarCompra(compra.id, dados) : await criarCompra(dados);
      onSalva(salva);
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErros(porCampo);
      setErro(Object.keys(porCampo).length ? '' : e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onFechar} maxWidth="sm" fullWidth>
      <DialogTitle>{compra ? 'Corrigir compra' : 'Registrar compra'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField label="O que foi comprado" placeholder="Hortifruti da semana" value={form.descricao} onChange={mudar('descricao')}
            error={Boolean(erros.descricao)} helperText={erros.descricao} autoFocus />
          <TextField label="Fornecedor (opcional)" value={form.fornecedor} onChange={mudar('fornecedor')}
            error={Boolean(erros.fornecedor)} helperText={erros.fornecedor} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <CampoDinheiro label="Valor" value={form.valor} onChange={mudar('valor')} sx={{ flex: 1 }}
              error={Boolean(erros.valorCentavos)} helperText={erros.valorCentavos} />
            <TextField label="Data" type="date" value={form.data} onChange={mudar('data')} sx={{ flex: 1 }}
              error={Boolean(erros.data)} helperText={erros.data}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoje() } }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" loading={enviando} onClick={salvar}>{compra ? 'Salvar correção' : 'Registrar compra'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Compras() {
  const mesAtual = hoje().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const { dados, erro, carregando, recarregar } = useApi(useCallback(() => listarCompras(limitesDoMes(mes)), [mes]));
  const [editando, setEditando] = useState(null);
  const [apagando, setApagando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const { aviso, avisar } = useAviso();

  async function apagar() {
    setOcupado(true);
    try {
      await removerCompra(apagando.id);
      avisar('Compra apagada.');
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
      setApagando(null);
    }
  }

  const total = (dados ?? []).reduce((s, c) => s + c.valorCentavos, 0);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Compras</Typography>
          <Typography color="text.secondary">Alimentos e insumos. Entram como despesa no financeiro.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditando({})}>Registrar compra</Button>
      </Stack>

      <SeletorMes mes={mes} onChange={setMes} maximo={mesAtual} />
      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Compra</TableCell>
                  <TableCell>Registrada por</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dataBr(c.data)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{c.descricao}</Typography>
                      {c.fornecedor && <Typography variant="body2" color="text.secondary">{c.fornecedor}</Typography>}
                    </TableCell>
                    <TableCell>{nomeCompleto(c.registradoPor)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{reais(c.valorCentavos)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button size="small" onClick={() => setEditando(c)}>Corrigir</Button>
                      <Button size="small" color="error" onClick={() => setApagando(c)}>Apagar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {dados.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma compra registrada neste mês.</TableCell></TableRow>
                )}
              </TableBody>
              {dados.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>Total do mês</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{reais(total)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        </Paper>
      )}

      {editando && (
        <FormCompra
          compra={editando.id ? editando : null}
          onFechar={() => setEditando(null)}
          onSalva={() => { setEditando(null); avisar('Compra salva.'); recarregar(); }}
        />
      )}
      <ConfirmarDialog
        aberto={Boolean(apagando)}
        titulo="Apagar esta compra?"
        texto={apagando && `${apagando.descricao}, ${reais(apagando.valorCentavos)}. Ela sai das despesas do financeiro.`}
        textoConfirmar="Apagar compra"
        perigoso
        carregando={ocupado}
        onConfirmar={apagar}
        onCancelar={() => setApagando(null)}
      />
      {aviso}
    </Stack>
  );
}
