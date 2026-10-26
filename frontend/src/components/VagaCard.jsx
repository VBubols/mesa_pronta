import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ChipCompatibilidade from './ChipCompatibilidade.jsx';
import { rotulo } from '../constants/rotulo.js';
import { dataRelativa, localDaVaga } from '../utils/formatos.js';

const MAX_SKILLS = 5;

export default function VagaCard({ vaga, mostrarCompatibilidade = true }) {
  const location = useLocation();
  const local = localDaVaga(vaga);
  const extras = vaga.skills.length - MAX_SKILLS;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/vagas/${vaga.id}`}
        state={{ voltarPara: `${location.pathname}${location.search}` }}
        sx={{ height: '100%', alignItems: 'stretch' }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {vaga.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {vaga.empresa ?? 'Empresa não informada'}
              </Typography>
            </Box>
          </Stack>

          {mostrarCompatibilidade && (
            <Box>
              <ChipCompatibilidade valor={vaga.compatibilidade} />
            </Box>
          )}

          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {vaga.nivel && <Chip size="small" label={rotulo('niveis', vaga.nivel)} />}
            {vaga.modalidade && <Chip size="small" label={rotulo('modalidades', vaga.modalidade)} />}
            {vaga.stack && <Chip size="small" variant="outlined" label={rotulo('stacks', vaga.stack)} />}
          </Stack>

          {local && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <PlaceOutlinedIcon fontSize="small" />
              <Typography variant="body2">{local}</Typography>
            </Stack>
          )}

          {vaga.skills.length > 0 && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {vaga.skills.slice(0, MAX_SKILLS).map((skill) => (
                <Chip key={skill.id} size="small" variant="outlined" color="primary" label={skill.nome} />
              ))}
              {extras > 0 && <Chip size="small" variant="outlined" label={`+${extras}`} />}
            </Stack>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 0.5 }}>
            {vaga.origem === 'interna' ? 'Vaga do portal' : 'Via GitHub'}
            {vaga.publicadaEm && ` · ${dataRelativa(vaga.publicadaEm)}`}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
