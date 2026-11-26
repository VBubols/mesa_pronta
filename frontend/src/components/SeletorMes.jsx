import { IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Navega entre meses. `mes` é 'AAAA-MM'.
// '2026-11' -> 'Novembro de 2026'
function nomeDoMes(mes) {
  const texto = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function somarMes(mes, delta) {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default function SeletorMes({ mes, onChange, maximo }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <IconButton aria-label="Mês anterior" onClick={() => onChange(somarMes(mes, -1))}><ChevronLeftIcon /></IconButton>
      <Typography sx={{ minWidth: 170, textAlign: 'center', fontWeight: 700 }} aria-live="polite">
        {nomeDoMes(mes)}
      </Typography>
      <IconButton aria-label="Próximo mês" disabled={maximo && mes >= maximo} onClick={() => onChange(somarMes(mes, 1))}>
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
}
