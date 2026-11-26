import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Fica dentro da RotaProtegida: aqui o usuário já está logado, falta ter o perfil certo.
// <Route element={<RotaPorPerfil perfis={['admin']} />}>
export default function RotaPorPerfil({ perfis }) {
  const { usuario, ehGestao } = useAuth();
  if (!perfis.includes(usuario?.role)) {
    return <Navigate to={ehGestao ? '/gestao' : '/'} replace />;
  }
  return <Outlet />;
}
