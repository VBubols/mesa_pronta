import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress,
  MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { atualizarProduto, criarProduto, listarProdutos } from '../../api/cardapio.js';
import { errosPorCampo } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAviso } from '../../hooks/useAviso.jsx';
import { opcoes, ROTULOS } from '../../constants/rotulos.js';
import { centavosParaTexto, paraCentavos, reais } from '../../utils/formatos.js';
import CampoDinheiro from '../../components/CampoDinheiro.jsx';

function FormProduto({ produto, onFechar, onSalvo }) {
  const [form, setForm] = useState({
    nome: produto?.nome ?? '',
    categoria: produto?.categoria ?? 'prato_principal',
    preco: produto ? centavosParaTexto(produto.precoCentavos) : '',
    descricao: produto?.descricao ?? '',
    disponivel: produto?.disponivel ?? true,
  });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function salvar() {
    const precoCentavos = paraCentavos(form.preco);
    if (precoCentavos === null) {
      setErros({ precoCentavos: 'Informe o preço, ex.: 34,90' });
      return;
    }
    setErros({});
    setErro('');
    setEnviando(true);
    try {
      const dados = { nome: form.nome, categoria: form.categoria, precoCentavos, descricao: form.descricao, disponivel: form.disponivel };
      const salvo = produto ? await atualizarProduto(produto.id, dados) : await criarProduto(dados);
      onSalvo(salvo);
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
      <DialogTitle>{produto ? 'Editar produto' : 'Novo produto'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField label="Nome" value={form.nome} onChange={mudar('nome')} error={Boolean(erros.nome)} helperText={erros.nome} autoFocus />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Categoria" value={form.categoria} onChange={mudar('categoria')} sx={{ flex: 1 }}>
              {opcoes('categorias').map((o) => <MenuItem key={o.valor} value={o.valor}>{o.rotulo}</MenuItem>)}
            </TextField>
            <CampoDinheiro label="Preço" value={form.preco} onChange={mudar('preco')} sx={{ flex: 1 }}
              error={Boolean(erros.precoCentavos)} helperText={erros.precoCentavos} />
          </Stack>
          <TextField label="Descrição (opcional)" value={form.descricao} onChange={mudar('descricao')} multiline minRows={2}
            error={Boolean(erros.descricao)} helperText={erros.descricao} slotProps={{ htmlInput: { maxLength: 500 } }} />
          <FormControlLabel control={<Switch checked={form.disponivel} onChange={mudar('disponivel')} />} label="Disponível no cardápio" />
          {produto && (
            <Typography variant="body2" color="text.secondary">
              Mudar o preço não altera pedidos já feitos: cada pedido guarda o preço da época.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" loading={enviando} onClick={salvar}>{produto ? 'Salvar alterações' : 'Cadastrar produto'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Produtos() {
  const { dados, erro, carregando, recarregar } = useApi(useCallback(() => listarProdutos(), []));
  const [editando, setEditando] = useState(null); // null fechado, {} novo, produto editar
  const { aviso, avisar } = useAviso();

  async function alternar(produto) {
    try {
      await atualizarProduto(produto.id, { disponivel: !produto.disponivel });
      avisar(produto.disponivel ? `${produto.nome} saiu do cardápio.` : `${produto.nome} voltou ao cardápio.`);
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Cardápio</Typography>
          <Typography color="text.secondary">Produtos indisponíveis somem do site e do lançamento de pedidos.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditando({})}>Novo produto</Button>
      </Stack>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Preço</TableCell>
                  <TableCell>Disponível</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(ROTULOS.categorias).map(([categoria, titulo]) => {
                  const itens = dados.filter((p) => p.categoria === categoria);
                  if (!itens.length) return null;
                  return [
                    <TableRow key={categoria}>
                      <TableCell colSpan={4} sx={{ bgcolor: 'background.default', fontWeight: 700 }}>{titulo}</TableCell>
                    </TableRow>,
                    ...itens.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: p.disponivel ? 'text.primary' : 'text.secondary' }}>{p.nome}</Typography>
                          {p.descricao && <Typography variant="body2" color="text.secondary">{p.descricao}</Typography>}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{reais(p.precoCentavos)}</TableCell>
                        <TableCell>
                          <Switch checked={p.disponivel} onChange={() => alternar(p)} slotProps={{ input: { 'aria-label': `${p.nome} disponível` } }} />
                        </TableCell>
                        <TableCell align="right"><Button size="small" onClick={() => setEditando(p)}>Editar</Button></TableCell>
                      </TableRow>
                    )),
                  ];
                })}
                {dados.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Cadastre o primeiro produto do cardápio.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {editando && (
        <FormProduto
          produto={editando.id ? editando : null}
          onFechar={() => setEditando(null)}
          onSalvo={(p) => { setEditando(null); avisar(`${p.nome} salvo.`); recarregar(); }}
        />
      )}
      {aviso}
    </Stack>
  );
}
