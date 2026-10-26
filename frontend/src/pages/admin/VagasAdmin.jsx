import { useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Grid, IconButton, LinearProgress, MenuItem, Pagination, Paper, Snackbar, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { listarVagasAdmin, ocultarVaga, reexibirVaga, removerVagaInterna } from '../../api/admin.js';
import { useApi } from '../../hooks/useApi.js';
import { rotulo } from '../../constants/rotulo.js';
import ConfirmarDialog from '../../components/ConfirmarDialog.jsx';
import FormVagaInterna from './FormVagaInterna.jsx';

const LIMITE = 10;

// Situação -> filtros da API (ativa = não encerrada no GitHub; oculta = escondida pelo admin)
const SITUACOES = {
  todas: {},
  visiveis: { ativa: 'true', oculta: 'false' },
  ocultas: { oculta: 'true' },
  encerradas: { ativa: 'false' },
};

export default function VagasAdmin({ versao }) {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ busca: '', origem: '', situacao: 'todas', pagina: 1 });
  const [formulario, setFormulario] = useState(null); // { vaga } aberto; vaga null = nova
  const [removendo, setRemovendo] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(
    () => listarVagasAdmin({
      busca: filtros.busca,
      origem: filtros.origem,
      ...SITUACOES[filtros.situacao],
      pagina: filtros.pagina,
      limite: LIMITE,
      versao, // força recarregar depois de uma sincronização (o backend ignora)
    }),
    [filtros, versao],
  );
  const { dados, erro, carregando, recarregar } = useApi(carregar);

  const filtrar = (mudancas) => setFiltros((f) => ({ ...f, ...mudancas, pagina: 1 }));

  async function executar(acao, mensagem) {
    setOcupado(true);
    try {
      await acao();
      setAviso({ tipo: 'success', texto: mensagem });
      recarregar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarRemocao() {
    await executar(() => removerVagaInterna(removendo.id), 'Vaga removida.');
    setRemovendo(null);
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">Vagas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormulario({ vaga: null })}>
          Nova vaga interna
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid
          container
          spacing={2}
          component="form"
          onSubmit={(e) => { e.preventDefault(); filtrar({ busca: busca.trim() }); }}
        >
          <Grid size={{ xs: 12, md: 'grow' }}>
            <TextField fullWidth size="small" label="Buscar por título ou empresa" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField select fullWidth size="small" label="Origem" value={filtros.origem} onChange={(e) => filtrar({ origem: e.target.value })}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="interna">Internas</MenuItem>
              <MenuItem value="github">GitHub</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField select fullWidth size="small" label="Situação" value={filtros.situacao} onChange={(e) => filtrar({ situacao: e.target.value })}>
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="visiveis">Visíveis</MenuItem>
              <MenuItem value="ocultas">Ocultas</MenuItem>
              <MenuItem value="encerradas">Encerradas</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Button type="submit" variant="outlined" fullWidth sx={{ height: '100%', minHeight: 40 }}>Buscar</Button>
          </Grid>
        </Grid>
      </Paper>

      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Vaga</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell>Nível</TableCell>
                  <TableCell>Modalidade</TableCell>
                  <TableCell>Situação</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.dados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Nenhuma vaga encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {dados.dados.map((vaga) => {
                  const interna = vaga.origem === 'interna';
                  const visivel = vaga.ativa && !vaga.oculta;
                  return (
                    <TableRow key={vaga.id} hover>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{vaga.titulo}</Typography>
                        <Typography variant="caption" color="text.secondary">{vaga.empresa ?? 'Empresa não informada'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={interna ? 'secondary' : 'default'} label={interna ? 'Interna' : 'GitHub'} />
                      </TableCell>
                      <TableCell>{rotulo('niveis', vaga.nivel)}</TableCell>
                      <TableCell>{rotulo('modalidades', vaga.modalidade)}</TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                          {!vaga.ativa && <Chip size="small" label="Encerrada" />}
                          {vaga.oculta && <Chip size="small" color="warning" label="Oculta" />}
                          {visivel && <Chip size="small" color="success" label="Visível" />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {visivel && (
                          <Tooltip title="Ver como candidato">
                            <IconButton size="small" component={RouterLink} to={`/vagas/${vaga.id}`} aria-label={`Ver ${vaga.titulo}`}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {interna && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => setFormulario({ vaga })} aria-label={`Editar ${vaga.titulo}`}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={vaga.oculta ? 'Reexibir' : 'Ocultar'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={ocupado}
                              aria-label={`${vaga.oculta ? 'Reexibir' : 'Ocultar'} ${vaga.titulo}`}
                              onClick={() => executar(
                                () => (vaga.oculta ? reexibirVaga(vaga.id) : ocultarVaga(vaga.id)),
                                vaga.oculta ? 'Vaga visível de novo.' : 'Vaga ocultada.',
                              )}
                            >
                              {vaga.oculta ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        {interna && (
                          <Tooltip title="Remover">
                            <IconButton size="small" color="error" onClick={() => setRemovendo(vaga)} aria-label={`Remover ${vaga.titulo}`}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">{dados.paginacao.total} vaga(s)</Typography>
            {dados.paginacao.totalPaginas > 1 && (
              <Pagination
                size="small"
                count={dados.paginacao.totalPaginas}
                page={filtros.pagina}
                onChange={(_, pagina) => setFiltros((f) => ({ ...f, pagina }))}
              />
            )}
          </Box>
        </Paper>
      )}

      {formulario && (
        <FormVagaInterna
          key={formulario.vaga?.id ?? 'nova'}
          vaga={formulario.vaga}
          onFechar={() => setFormulario(null)}
          onSalvo={() => {
            setAviso({ tipo: 'success', texto: formulario.vaga ? 'Vaga atualizada.' : 'Vaga publicada.' });
            setFormulario(null);
            recarregar();
          }}
        />
      )}

      <ConfirmarDialog
        aberto={Boolean(removendo)}
        titulo="Remover vaga?"
        texto={`"${removendo?.titulo}" será removida definitivamente. Para só tirar do ar, use ocultar.`}
        textoConfirmar="Remover"
        perigoso
        carregando={ocupado}
        onConfirmar={confirmarRemocao}
        onCancelar={() => setRemovendo(null)}
      />

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={aviso?.tipo ?? 'success'} variant="filled" onClose={() => setAviso(null)}>{aviso?.texto}</Alert>
      </Snackbar>
    </Stack>
  );
}
