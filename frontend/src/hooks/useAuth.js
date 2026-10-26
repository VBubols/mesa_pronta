import { useContext } from 'react';
import { AuthContext } from '../contexts/contextos.js';

// const { usuario, logado, ehAdmin, entrar, sair } = useAuth();
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro do <AuthProvider>');
  return contexto;
}
