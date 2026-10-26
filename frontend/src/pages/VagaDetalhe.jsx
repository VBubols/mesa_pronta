import { useCallback } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper,
  Stack, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import WorkOffOutlinedIcon from '@mui/icons-material/WorkOffOutlined';
import { obterVaga } from '../api/vagas.js';
import { useApi } from '../hooks/useApi.js';
import { rotulo } from '../constants/rotulo.js';
import { formatarData, localDaVaga } from '../utils/formatos.js';
import Markdown from '../components/Markdown.jsx';
import EstadoVazio from '../components/EstadoVazio.jsx';

const CRITERIOS = [
  { chave: 'nivel', nome: 'Nível' },
  { chave: 'modalidade', nome: 'Modalidade' },
  { chave: 'localizacao', nome: 'Localização' },
];

function IconeCriterio({ valor }) {
  if (valor === true) return <CheckCircleIcon color="success" />;
  if (valor === false) return <CancelIcon color="error" />;
  return <HelpOutlineIcon color="disabled" />;
}

const textoCriterio = (valor) => (valor === true ? 'Atende' : valor === false ? 'Não atende' : 'A vaga não informa');

function PainelMatch({ match }) {
  if (!match) {
    return (
      <Alert
        severity="info"
        action={<Button color="inherit" size="small" component={RouterLink} to="/curriculo">Preencher</Button>}
      >
        Preencha seu currículo para ver a compatibilidade com esta vaga.
      </Alert>
    );
  }

  const { compatibilidade, elegivel, criterios, skillsQueTem, skillsQueFaltam } = match;

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={compatibilidade ?? 0}
            size={72}
            thickness={5}
            color={compatibilidade >= 70 ? 'success' : compatibilidade >= 40 ? 'warning' : 'inherit'}
            aria-label="Compatibilidade"
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
              {compatibilidade === null ? '–' : `${compatibilidade}%`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {compatibilidade === null
            ? 'A vaga não tem skills cadastradas para comparar.'
            : `Você tem ${skillsQueTem.length} de ${skillsQueTem.length + skillsQueFaltam.length} skills pedidas.`}
        </Typography>
      </Stack>

      {!elegivel && (
        <Alert severity="warning">Esta vaga não combina com algum critério do seu currículo.</Alert>
      )}

      <List dense disablePadding>
        {CRITERIOS.map(({ chave, nome }) => (
          <ListItem key={chave} disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <IconeCriterio valor={criterios[chave]} />
            </ListItemIcon>
            <ListItemText primary={nome} secondary={textoCriterio(criterios[chave])} />
          </ListItem>
        ))}
      </List>

      {skillsQueTem.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Skills que você tem</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {skillsQueTem.map((s) => <Chip key={s.id} size="small" color="success" label={s.nome} />)}
          </Stack>
        </Box>
      )}
      {skillsQueFaltam.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Skills que faltam</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {skillsQueFaltam.map((s) => <Chip key={s.id} size="small" variant="outlined" label={s.nome} />)}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Boas candidatas para estudar a seguir.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

export default function VagaDetalhe() {
  const { id } = useParams();
  const location = useLocation();
  const voltarPara = location.state?.voltarPara ?? '/vagas';

  const carregar = useCallback(() => obterVaga(id), [id]);
  const { dados, erro, carregando } = useApi(carregar);

  const voltar = (
    <Button component={RouterLink} to={voltarPara} startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
      Voltar para as vagas
    </Button>
  );

  if (erro) {
    return (
      <Stack spacing={2}>
        {voltar}
        {erro.status === 404 || erro.status === 400 ? (
          <EstadoVazio
            icone={<WorkOffOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />}
            titulo="Vaga não encontrada"
            texto="Ela pode ter sido encerrada ou removida."
          />
        ) : (
          <Alert severity="error">{erro.message}</Alert>
        )}
      </Stack>
    );
  }

  if (carregando || !dados) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { vaga, match } = dados;
  const local = localDaVaga(vaga);

  return (
    <Stack spacing={2}>
      {voltar}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {vaga.titulo}
                </Typography>
                <Typography color="text.secondary">{vaga.empresa ?? 'Empresa não informada'}</Typography>
              </Box>

              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {vaga.nivel && <Chip size="small" label={rotulo('niveis', vaga.nivel)} />}
                {vaga.modalidade && <Chip size="small" label={rotulo('modalidades', vaga.modalidade)} />}
                {local && <Chip size="small" label={local} />}
                {vaga.contratacao && <Chip size="small" variant="outlined" label={rotulo('contratacoes', vaga.contratacao)} />}
                {vaga.stack && <Chip size="small" variant="outlined" label={rotulo('stacks', vaga.stack)} />}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {vaga.origem === 'interna' ? 'Vaga publicada pelo portal' : 'Vaga importada do GitHub'}
                {vaga.publicadaEm && ` em ${formatarData(vaga.publicadaEm)}`}
              </Typography>

              <Button
                variant="contained"
                size="large"
                href={vaga.link}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              >
                Ver vaga e candidatar-se
              </Button>

              <Divider />

              {vaga.descricao ? (
                <Markdown>{vaga.descricao}</Markdown>
              ) : (
                <Typography color="text.secondary">A vaga não tem descrição.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Compatibilidade
            </Typography>
            <PainelMatch match={match} />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
