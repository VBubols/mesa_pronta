import { Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';

// Lista de itens do currículo (experiências, formações...): adicionar, editar e remover.
// renderItem(item, indice) devolve os campos de um item.
export default function ListaEditavel({ itens, max, rotuloItem, textoAdicionar, textoVazio, onAdicionar, onRemover, renderItem }) {
  return (
    <Stack spacing={2}>
      {itens.length === 0 && <Typography color="text.secondary">{textoVazio}</Typography>}

      {itens.map((item, indice) => (
        <Paper key={indice} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {rotuloItem} {indice + 1}
            </Typography>
            <Tooltip title="Remover">
              <IconButton size="small" onClick={() => onRemover(indice)} aria-label={`Remover ${rotuloItem.toLowerCase()} ${indice + 1}`}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          {renderItem(item, indice)}
        </Paper>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={onAdicionar}
        disabled={itens.length >= max}
        sx={{ alignSelf: 'flex-start' }}
      >
        {itens.length >= max ? `Limite de ${max} atingido` : textoAdicionar}
      </Button>
    </Stack>
  );
}
