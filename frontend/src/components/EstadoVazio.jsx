import { Paper, Stack, Typography } from '@mui/material';

// Mensagem de "nada aqui ainda", com uma ação opcional (ex.: botão para o currículo).
export default function EstadoVazio({ icone, titulo, texto, acao }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        {icone}
        <Typography variant="h6" component="h2">
          {titulo}
        </Typography>
        {texto && (
          <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
            {texto}
          </Typography>
        )}
        {acao}
      </Stack>
    </Paper>
  );
}
