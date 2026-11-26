import { Box, Chip, Stack, Typography } from '@mui/material';
import { CORES } from '../theme.js';
import { hora, nomeCompleto, reais } from '../utils/formatos.js';

// A comanda de papel do salão: o pedido como a cozinha e o garçom enxergam.
// `furos` é a cor de fundo da coluna, para a serrilha do topo "furar" o papel.
export default function Comanda({ pedido, acoes, furos = CORES.fundo }) {
  return (
    <Box
      component="article"
      aria-label={`Pedido da mesa ${pedido.mesa?.numero}`}
      sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderTop: 0,
        borderRadius: '0 0 6px 6px',
        pt: 2.5,
        px: 2,
        pb: 1.5,
        // Serrilha de bloco de comanda
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `radial-gradient(circle at 7px 0, ${furos} 4px, transparent 4.5px) 0 0 / 14px 8px repeat-x`,
          borderTop: `1px dashed ${CORES.linha}`,
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
          Mesa {pedido.mesa?.numero}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {hora(pedido.createdAt)}
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {pedido.garcom ? `Garçom: ${nomeCompleto(pedido.garcom)}` : 'Sem garçom'}
      </Typography>
      {pedido.origem === 'antecipado' && (
        <Chip size="small" color="info" variant="outlined" label="Compra antecipada, já paga" sx={{ mt: 1 }} />
      )}

      <Box component="ul" sx={{ listStyle: 'none', p: 0, my: 1.5 }}>
        {pedido.itens.map((item) => (
          <Box component="li" key={item.id} sx={{ display: 'flex', gap: 1, py: 0.25 }}>
            <Typography sx={{ fontWeight: 800, minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{item.quantidade}×</Typography>
            <Typography>{item.nomeProduto}</Typography>
          </Box>
        ))}
      </Box>

      {pedido.observacao && (
        <Typography
          variant="body2"
          sx={{ borderLeft: 3, borderColor: 'secondary.main', pl: 1, mb: 1.5, fontStyle: 'italic' }}
        >
          {pedido.observacao}
        </Typography>
      )}

      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', borderTop: `1px dashed ${CORES.linha}`, pt: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          Total com 10%
        </Typography>
        <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{reais(pedido.totalCentavos)}</Typography>
      </Stack>

      {acoes && <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>{acoes}</Stack>}
    </Box>
  );
}
