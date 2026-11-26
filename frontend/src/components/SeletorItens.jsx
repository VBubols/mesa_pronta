import { Box, Divider, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { ROTULOS } from '../constants/rotulos.js';
import { calcularValores, reais } from '../utils/formatos.js';

// Monta um pedido a partir do cardápio. `quantidades` é { [produtoId]: número }.
// Usado pelo garçom (pedido na mesa) e pelo cliente (compra antecipada).
export default function SeletorItens({ produtos, quantidades, onChange }) {
  const mudar = (id, delta) => {
    const nova = Math.max(0, Math.min(50, (quantidades[id] ?? 0) + delta));
    const proximo = { ...quantidades, [id]: nova };
    if (!nova) delete proximo[id];
    onChange(proximo);
  };

  const escolhidos = produtos
    .filter((p) => quantidades[p.id])
    .map((p) => ({ precoCentavos: p.precoCentavos, quantidade: quantidades[p.id] }));
  const { subtotal, taxa, total } = calcularValores(escolhidos);

  return (
    <Stack spacing={2}>
      {Object.entries(ROTULOS.categorias).map(([categoria, titulo]) => {
        const daCategoria = produtos.filter((p) => p.categoria === categoria);
        if (!daCategoria.length) return null;
        return (
          <Box key={categoria}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{titulo}</Typography>
            {daCategoria.map((p) => {
              const qtd = quantidades[p.id] ?? 0;
              return (
                <Stack
                  key={p.id}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', py: 0.5, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: qtd ? 700 : 400 }}>{p.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">{reais(p.precoCentavos)}</Typography>
                  </Box>
                  <IconButton size="small" aria-label={`Tirar um ${p.nome}`} disabled={!qtd} onClick={() => mudar(p.id, -1)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ width: 24, textAlign: 'center', fontWeight: 700 }} aria-live="polite">{qtd}</Typography>
                  <IconButton size="small" color="primary" aria-label={`Adicionar um ${p.nome}`} onClick={() => mudar(p.id, 1)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Box>
        );
      })}

      <Divider />
      <Stack spacing={0.5}>
        <Linha rotulo="Subtotal" valor={reais(subtotal)} />
        <Linha rotulo="Serviço do garçom (10%)" valor={reais(taxa)} />
        <Linha rotulo="Total" valor={reais(total)} forte />
      </Stack>
    </Stack>
  );
}

function Linha({ rotulo, valor, forte }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography sx={{ fontWeight: forte ? 700 : 400 }}>{rotulo}</Typography>
      <Typography sx={{ fontWeight: forte ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{valor}</Typography>
    </Stack>
  );
}
