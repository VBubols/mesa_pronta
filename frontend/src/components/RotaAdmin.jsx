import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Fica dentro da RotaProtegida: aqui o usuário já está logado, só falta ser admin.
export default function RotaAdmin() {
  const { ehAdmin } = useAuth();
  if (!ehAdmin) return <Navigate to="/vagas" replace />;
  return <Outlet />;
}
