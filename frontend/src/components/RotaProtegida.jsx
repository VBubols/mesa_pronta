import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Sem login, manda para /login e lembra a página pedida para voltar depois.
export default function RotaProtegida() {
  const { logado } = useAuth();
  const location = useLocation();

  if (!logado) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return <Outlet />;
}
