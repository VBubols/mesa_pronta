import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

// O botão de desistir diz "Voltar", para não confundir com ações de cancelar (reserva, pedido).
export default function ConfirmarDialog({ aberto, titulo, texto, textoConfirmar = 'Confirmar', perigoso, carregando, desabilitado, onConfirmar, onCancelar, children }) {
  return (
    <Dialog open={aberto} onClose={carregando ? undefined : onCancelar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{texto}</DialogContentText>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={carregando}>
          Voltar
        </Button>
        <Button
          onClick={onConfirmar}
          variant="contained"
          color={perigoso ? 'error' : 'primary'}
          loading={carregando}
          disabled={desabilitado}
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
