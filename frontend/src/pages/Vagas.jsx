import { useCallback, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Grid, InputAdornment, LinearProgress, Pagination, Paper, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WorkOffOutlinedIcon from '@mui/icons-material/WorkOffOutlined';
import { listarRecomendadas, listarVagas } from '../api/vagas.js';
import { useApi } from '../hooks/useApi.js';
import { opcoes } from '../constants/rotulo.js';
import VagaCard from '../components/VagaCard.jsx';
import EstadoVazio from '../components/EstadoVazio.jsx';

const LIMITE = 12;
const FILTROS_LISTA = [
  { parametro: 'nivel', grupo: 'niveis', rotulo: 'Nível' },
  { parametro: 'modalidade', grupo: 'modalidades', rotulo: 'Modalidade' },
  { parametro: 'stack', grupo: 'stacks', rotulo: 'Stack' },
];

// Filtros, aba e página ficam na URL: voltar do detalhe da vaga mantém a busca.
export default function Vagas() {
  const [params, setParams] = useSearchParams();
  const aba = params.get('aba') === 'todas' ? 'todas' : 'recomendadas';
  const q = params.get('q') ?? '';
  const nivel = params.get('nivel') ?? '';
  const modalidade = params.get('modalidade') ?? '';
  const stack = params.get('stack') ?? '';
  const pagina = Math.max(Number(params.get('pagina')) || 1, 1);

  const [busca, setBusca] = useState(q);

  const carregar = useCallback(() => {
    const listar = aba === 'todas' ? listarVagas : listarRecomendadas;
    return listar({ q, nivel, modalidade, stack, pagina, limite: LIMITE });
  }, [aba, q, nivel, modalidade, stack, pagina]);
  const { dados, erro, carregando } = useApi(carregar);

  // Muda parâmetros da URL; qualquer mudança de filtro volta para a página 1.
  function alterar(mudancas, { manterPagina = false } = {}) {
    const novos = new URLSearchParams(params);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }
    if (!manterPagina) novos.delete('pagina');
    setParams(novos);
  }

  function buscar(evento) {
    evento.preventDefault();
    alterar({ q: busca.trim() });
  }

  function limpar() {
    setBusca('');
    setParams(aba === 'todas' ? { aba } : {});
  }

  const temFiltro = Boolean(q || nivel || modalidade || stack);
  const semCurriculo = aba === 'recomendadas' && erro?.status === 404;
  const paginacao = dados?.paginacao;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Vagas
        </Typography>
        <Typography color="text.secondary">
          {aba === 'recomendadas'
            ? 'Vagas compatíveis com o seu currículo, da mais para a menos compatível.'
            : 'Todas as vagas abertas, das mais recentes para as mais antigas.'}
        </Typography>
      </Box>

      <Tabs value={aba} onChange={(_, nova) => { setBusca(q); alterar({ aba: nova === 'todas' ? 'todas' : '' }); }}>
        <Tab value="recomendadas" label="Recomendadas para você" />
        <Tab value="todas" label="Todas as vagas" />
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} component="form" onSubmit={buscar}>
          <Grid size={{ xs: 12, sm: 9, md: 10 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por cargo, empresa ou skill"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <Button type="submit" variant="contained" fullWidth sx={{ height: '100%', minHeight: 40 }}>
              Buscar
            </Button>
          </Grid>
          {FILTROS_LISTA.map(({ parametro, grupo, rotulo }) => {
            const todas = opcoes(grupo);
            const valores = (params.get(parametro) ?? '').split(',').filter(Boolean);
            return (
              <Grid key={parametro} size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={todas}
                  value={todas.filter((o) => valores.includes(o.valor))}
                  onChange={(_, novas) => alterar({ [parametro]: novas.map((o) => o.valor).join(',') })}
                  getOptionLabel={(o) => o.rotulo}
                  isOptionEqualToValue={(a, b) => a.valor === b.valor}
                  renderInput={(p) => <TextField {...p} label={rotulo} />}
                />
              </Grid>
            );
          })}
        </Grid>
        {temFiltro && (
          <Button size="small" onClick={limpar} sx={{ mt: 1.5 }}>
            Limpar filtros
          </Button>
        )}
      </Paper>

      {semCurriculo ? (
        <EstadoVazio
          icone={<DescriptionOutlinedIcon color="primary" sx={{ fontSize: 48 }} />}
          titulo="Preencha seu currículo para receber recomendações"
          texto="As recomendações comparam o seu nível, a modalidade, a cidade e as skills do currículo com cada vaga."
          acao={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" component={RouterLink} to="/curriculo">
                Preencher currículo
              </Button>
              <Button onClick={() => alterar({ aba: 'todas' })}>Ver todas as vagas</Button>
            </Stack>
          )}
        />
      ) : erro ? (
        <Alert severity="error">{erro.message}</Alert>
      ) : (
        <Box>
          {carregando && <LinearProgress sx={{ mb: 2 }} />}
          {paginacao && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {paginacao.total === 1 ? '1 vaga encontrada' : `${paginacao.total} vagas encontradas`}
            </Typography>
          )}

          {dados?.dados.length === 0 ? (
            <EstadoVazio
              icone={<WorkOffOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />}
              titulo="Nenhuma vaga encontrada"
              texto={temFiltro
                ? 'Tente remover alguns filtros ou buscar por outro termo.'
                : 'Ainda não há vagas compatíveis. Revise o seu currículo ou veja todas as vagas.'}
              acao={temFiltro && <Button onClick={limpar}>Limpar filtros</Button>}
            />
          ) : (
            <Grid container spacing={2}>
              {dados?.dados.map((vaga) => (
                <Grid key={vaga.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <VagaCard vaga={vaga} mostrarCompatibilidade={aba === 'recomendadas' || vaga.compatibilidade !== null} />
                </Grid>
              ))}
            </Grid>
          )}

          {paginacao?.totalPaginas > 1 && (
            <Pagination
              sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
              count={paginacao.totalPaginas}
              page={pagina}
              onChange={(_, nova) => {
                alterar({ pagina: nova > 1 ? String(nova) : '' }, { manterPagina: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </Box>
      )}
    </Stack>
  );
}
