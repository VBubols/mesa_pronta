import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Chip, LinearProgress, Pagination, Paper, Snackbar, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { desativarUsuario, listarUsuarios, reativarUsuario } from '../../api/admin.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatarData } from '../../utils/formatos.js';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';

const LIMITE = 10;

export default function UsuariosAdmin() {
  const { usuario: eu } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ busca: '', pagina: 1 });
  const [desativando, setDesativando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(() => listarUsuarios({ ...filtros, limite: LIMITE }), [filtros]);
  const { dados, erro, carregando, recarregar } = useApi(carregar);
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.limite)) : 1;

  async function alterar(usuario, ativar) {
    setOcupado(true);
    try {
      await (ativar ? reativarUsuario(usuario.id) : desativarUsuario(usuario.id));
      setAviso({ tipo: 'success', texto: ativar ? 'Usuário reativado.' : 'Usuário desativado.' });
      recarregar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setOcupado(false);
      setDesativando(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">Usuários</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          component="form"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          onSubmit={(e) => { e.preventDefault(); setFiltros({ busca: busca.trim(), pagina: 1 }); }}
        >
          <TextField fullWidth size="small" label="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <Button type="submit" variant="outlined">Buscar</Button>
        </Stack>
      </Paper>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 680 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Situação</TableCell>
                  <TableCell>Cadastro</TableCell>
                  <TableCell align="right">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.dados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                )}
                {dados.dados.map((u) => {
                  const souEu = u.id === eu?.id;
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.nome} {u.sobrenome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={u.role === 'admin' ? 'primary' : 'default'} label={u.role === 'admin' ? 'Admin' : 'Usuário'} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={u.ativo ? 'success' : 'default'} label={u.ativo ? 'Ativo' : 'Desativado'} />
                      </TableCell>
                      <TableCell>{formatarData(u.createdAt)}</TableCell>
                      <TableCell align="right">
                        {u.ativo ? (
                          <Tooltip title={souEu ? 'Você não pode desativar a própria conta' : ''}>
                            <span>
                              <Button size="small" color="error" disabled={souEu || ocupado} onClick={() => setDesativando(u)}>
                                Desativar
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button size="small" disabled={ocupado} onClick={() => alterar(u, true)}>Reativar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">{dados.total} usuário(s)</Typography>
            {totalPaginas > 1 && (
              <Pagination size="small" count={totalPaginas} page={filtros.pagina} onChange={(_, pagina) => setFiltros((f) => ({ ...f, pagina }))} />
            )}
          </Box>
        </Paper>
      )}

      <ConfirmarDialog
        aberto={Boolean(desativando)}
        titulo="Desativar usuário?"
        texto={`${desativando?.nome} não vai conseguir entrar até ser reativado.`}
        textoConfirmar="Desativar"
        perigoso
        carregando={ocupado}
        onConfirmar={() => alterar(desativando, false)}
        onCancelar={() => setDesativando(null)}
      />

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={aviso?.tipo ?? 'success'} variant="filled" onClose={() => setAviso(null)}>{aviso?.texto}</Alert>
      </Snackbar>
    </Stack>
  );
}
