import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, LinearProgress, MenuItem,
  Pagination, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField,
  Tooltip, Typography,
} from '@mui/material';
import { criarUsuario, desativarUsuario, listarUsuarios, reativarUsuario } from '../../api/admin.js';
import { errosPorCampo } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useAviso } from '../../hooks/useAviso.jsx';
import { rotulo } from '../../constants/rotulos.js';
import { mascaraTelefone, nomeCompleto } from '../../utils/formatos.js';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';

const LIMITE = 15;
const ABAS = [
  { valor: 'funcionario', rotulo: 'Funcionários' },
  { valor: 'cliente', rotulo: 'Clientes' },
  { valor: 'admin', rotulo: 'Admins' },
  { valor: '', rotulo: 'Todos' },
];

function FormFuncionario({ onFechar, onSalvo }) {
  const [form, setForm] = useState({ nome: '', sobrenome: '', email: '', telefoneCelular: '', senha: '', role: 'funcionario' });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = (nome, mascara) => ({
    value: form[nome],
    onChange: (e) => setForm((f) => ({ ...f, [nome]: mascara ? mascara(e.target.value) : e.target.value })),
    error: Boolean(erros[nome]),
    helperText: erros[nome],
    fullWidth: true,
  });

  async function salvar() {
    setErros({});
    setErro('');
    setEnviando(true);
    try {
      onSalvo(await criarUsuario(form));
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
      <DialogTitle>Cadastrar na equipe</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Funcionários lançam pedidos, fazem check-in das reservas e recebem os 10% das mesas que atendem.
            Passe a senha inicial para a pessoa trocar no primeiro acesso.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nome" autoFocus {...campo('nome')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Sobrenome" {...campo('sobrenome')} /></Grid>
            <Grid size={12}><TextField label="E-mail" type="email" {...campo('email')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Celular (opcional)" inputMode="tel" {...campo('telefoneCelular', mascaraTelefone)} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Senha inicial" {...campo('senha')} helperText={erros.senha ?? 'Pelo menos 6 caracteres'} /></Grid>
            <Grid size={12}>
              <TextField select label="Perfil" {...campo('role')}>
                <MenuItem value="funcionario">Funcionário</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={enviando}>Voltar</Button>
        <Button variant="contained" loading={enviando} onClick={salvar}>Cadastrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ role: 'funcionario', busca: '', pagina: 1 });
  const carregar = useCallback(() => listarUsuarios({ ...filtros, limite: LIMITE }), [filtros]);
  const { dados, erro, carregando, recarregar } = useApi(carregar);
  const [cadastrando, setCadastrando] = useState(false);
  const [desativando, setDesativando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const { aviso, avisar } = useAviso();
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.limite)) : 1;

  async function alterar(usuario, ativar) {
    setOcupado(true);
    try {
      await (ativar ? reativarUsuario(usuario.id) : desativarUsuario(usuario.id));
      avisar(ativar ? `${usuario.nome} pode entrar de novo.` : `${usuario.nome} não consegue mais entrar.`);
      recarregar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
      setDesativando(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Equipe e clientes</Typography>
          <Typography color="text.secondary">Clientes se cadastram pelo site. A equipe é cadastrada aqui.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setCadastrando(true)}>Cadastrar na equipe</Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
        <Tabs value={filtros.role} onChange={(_, role) => setFiltros((f) => ({ ...f, role, pagina: 1 }))} variant="scrollable">
          {ABAS.map((a) => <Tab key={a.valor} value={a.valor} label={a.rotulo} />)}
        </Tabs>
        <Stack component="form" direction="row" spacing={1}
          onSubmit={(e) => { e.preventDefault(); setFiltros((f) => ({ ...f, busca: busca.trim(), pagina: 1 })); }}>
          <TextField size="small" label="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <Button type="submit" variant="outlined">Buscar</Button>
        </Stack>
      </Stack>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 680 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Contato</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Acesso</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.dados.map((u) => {
                  const souEu = u.id === eu?.id;
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{nomeCompleto(u)}</TableCell>
                      <TableCell>
                        {u.email}
                        {u.telefoneCelular && <Typography variant="body2" color="text.secondary">{mascaraTelefone(u.telefoneCelular)}</Typography>}
                      </TableCell>
                      <TableCell>{rotulo('perfis', u.role)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={u.ativo ? 'primary' : 'default'} variant={u.ativo ? 'filled' : 'outlined'} label={u.ativo ? 'Ativo' : 'Desativado'} />
                      </TableCell>
                      <TableCell align="right">
                        {u.ativo ? (
                          <Tooltip title={souEu ? 'Você não pode desativar a própria conta' : ''}>
                            <span>
                              <Button size="small" color="error" disabled={souEu || ocupado} onClick={() => setDesativando(u)}>Desativar</Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button size="small" disabled={ocupado} onClick={() => alterar(u, true)}>Reativar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {dados.dados.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ninguém encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">{dados.total} {dados.total === 1 ? 'pessoa' : 'pessoas'}</Typography>
            {totalPaginas > 1 && (
              <Pagination size="small" count={totalPaginas} page={filtros.pagina} onChange={(_, pagina) => setFiltros((f) => ({ ...f, pagina }))} />
            )}
          </Box>
        </Paper>
      )}

      {cadastrando && (
        <FormFuncionario
          onFechar={() => setCadastrando(false)}
          onSalvo={(u) => { setCadastrando(false); avisar(`${u.nome} cadastrado.`); setFiltros((f) => ({ ...f, role: u.role, pagina: 1 })); }}
        />
      )}
      <ConfirmarDialog
        aberto={Boolean(desativando)}
        titulo={`Desativar ${desativando?.nome}?`}
        texto="A pessoa não consegue entrar até ser reativada. O histórico de pedidos e reservas continua."
        textoConfirmar="Desativar"
        perigoso
        carregando={ocupado}
        onConfirmar={() => alterar(desativando, false)}
        onCancelar={() => setDesativando(null)}
      />
      {aviso}
    </Stack>
  );
}
