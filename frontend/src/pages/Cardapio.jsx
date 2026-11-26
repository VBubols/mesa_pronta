import { useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { listarCardapio } from '../api/cardapio.js';
import { opcoesReserva } from '../api/reservas.js';
import { useApi } from '../hooks/useApi.js';
import { ROTULOS } from '../constants/rotulos.js';
import { reais } from '../utils/formatos.js';

// "12:00 e 13:30"
const juntar = (lista) => (lista.length > 1 ? `${lista.slice(0, -1).join(', ')} e ${lista.at(-1)}` : lista[0] ?? '');

// Página inicial do site: quando abrimos e o cardápio, como um menu impresso.
export default function Cardapio() {
  const { dados: produtos, erro, carregando } = useApi(useCallback(() => listarCardapio(), []));
  const { dados: opcoes } = useApi(useCallback(() => opcoesReserva(), []));

  const horarios = opcoes?.horarios ?? [];
  const almoco = horarios.filter((h) => h < '16:00');
  const jantar = horarios.filter((h) => h >= '16:00');

  return (
    <Stack spacing={{ xs: 4, sm: 6 }}>
      <Box component="header" sx={{ maxWidth: 620 }}>
        <Typography variant="h2" component="h1" sx={{ fontSize: { xs: 40, sm: 56 }, lineHeight: 1.02 }}>
          Abrimos de sexta a domingo.
        </Typography>
        {horarios.length > 0 && (
          <Typography sx={{ mt: 2, fontSize: 18, color: 'text.secondary' }}>
            Almoço às {juntar(almoco)}. Jantar às {juntar(jantar)}. O salão é pequeno, então
            atendemos com reserva, e você já pode deixar o pedido pago.
          </Typography>
        )}
        <Button component={RouterLink} to="/reservar" variant="contained" size="large" sx={{ mt: 3 }}>
          Reservar mesa
        </Button>
      </Box>

      <Paper
        component="section"
        aria-labelledby="titulo-cardapio"
        variant="outlined"
        sx={{ p: { xs: 3, sm: 6 }, borderRadius: 2 }}
      >
        <Typography id="titulo-cardapio" variant="h3" component="h2" sx={{ fontSize: { xs: 30, sm: 38 }, mb: 1 }}>
          Cardápio
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Os preços não incluem os 10% do garçom.
        </Typography>

        {erro && <Alert severity="error">{erro.message}</Alert>}
        {carregando && <LinearProgress />}

        <Stack spacing={5}>
          {produtos && Object.entries(ROTULOS.categorias).map(([categoria, titulo]) => {
            const itens = produtos.filter((p) => p.categoria === categoria);
            if (!itens.length) return null;
            return (
              <Box key={categoria} component="section">
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{ color: 'primary.main', borderBottom: 2, borderColor: 'primary.main', pb: 0.5, mb: 2 }}
                >
                  {titulo}
                </Typography>
                <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {itens.map((p) => (
                    <Box component="li" key={p.id}>
                      {/* Nome ..... preço, com a linha pontilhada dos menus impressos */}
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{p.nome}</Typography>
                        <Box aria-hidden sx={{ flexGrow: 1, borderBottom: '2px dotted', borderColor: 'divider', minWidth: 24 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {reais(p.precoCentavos)}
                        </Typography>
                      </Box>
                      {p.descricao && (
                        <Typography color="text.secondary" sx={{ maxWidth: '62ch' }}>{p.descricao}</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            );
          })}
          {produtos?.length === 0 && (
            <Typography color="text.secondary">O cardápio está sendo atualizado. Volte em breve.</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
