import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export default function ConfirmarDialog({ aberto, titulo, texto, textoConfirmar = 'Confirmar', perigoso, carregando, onConfirmar, onCancelar }) {
  return (
    <Dialog open={aberto} onClose={carregando ? undefined : onCancelar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{texto}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={carregando}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirmar}
          variant="contained"
          color={perigoso ? 'error' : 'primary'}
          loading={carregando}
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
