import { useCallback, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

// Mensagem rápida no topo da tela depois de uma ação.
//   const { aviso, avisar } = useAviso();
//   avisar('Pedido lançado.'); avisar(erro.message, 'error');
//   return <>{...}{aviso}</>;
export function useAviso() {
  const [atual, setAtual] = useState(null);
  const avisar = useCallback((texto, tipo = 'success') => setAtual({ texto, tipo, chave: Date.now() }), []);
  const fechar = () => setAtual(null);

  const aviso = (
    <Snackbar
      key={atual?.chave}
      open={Boolean(atual)}
      autoHideDuration={4000}
      onClose={fechar}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity={atual?.tipo ?? 'success'} variant="filled" onClose={fechar}>
        {atual?.texto}
      </Alert>
    </Snackbar>
  );

  return { aviso, avisar };
}
