import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Marca from './Marca.jsx';

// Moldura das telas de login e cadastro
export default function TelaAcesso({ titulo, texto, larguraMaxima = 420, children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 3, sm: 6 } }}>
      <Stack spacing={3} sx={{ maxWidth: larguraMaxima, mx: 'auto' }}>
        <Marca cor="text.primary" />
        <Card variant="outlined">
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: 30 }}>{titulo}</Typography>
            {texto && <Typography color="text.secondary" sx={{ mt: 1 }}>{texto}</Typography>}
            <Box sx={{ mt: 3 }}>{children}</Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
