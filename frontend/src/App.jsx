import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LinearProgress } from '@mui/material';
import LayoutSite from './components/LayoutSite.jsx';
import LayoutGestao from './components/LayoutGestao.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import RotaPorPerfil from './components/RotaPorPerfil.jsx';
import Cardapio from './pages/Cardapio.jsx';
import Login from './pages/Login.jsx';

// Cada tela é baixada só quando é aberta: o cliente não carrega o código da gestão.
const Cadastro = lazy(() => import('./pages/Cadastro.jsx'));
const Reservar = lazy(() => import('./pages/Reservar.jsx'));
const MinhasReservas = lazy(() => import('./pages/MinhasReservas.jsx'));
const Pedidos = lazy(() => import('./pages/gestao/Pedidos.jsx'));
const Reservas = lazy(() => import('./pages/gestao/Reservas.jsx'));
const Produtos = lazy(() => import('./pages/gestao/Produtos.jsx'));
const Mesas = lazy(() => import('./pages/gestao/Mesas.jsx'));
const Compras = lazy(() => import('./pages/gestao/Compras.jsx'));
const Financeiro = lazy(() => import('./pages/gestao/Financeiro.jsx'));
const Usuarios = lazy(() => import('./pages/gestao/Usuarios.jsx'));

export default function App() {
  return (
    <Suspense fallback={<LinearProgress />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Site do cliente. O cardápio é público; reservar exige conta de cliente. */}
        <Route element={<LayoutSite />}>
          <Route index element={<Cardapio />} />
          <Route element={<RotaProtegida />}>
            <Route element={<RotaPorPerfil perfis={['cliente']} />}>
              <Route path="/reservar" element={<Reservar />} />
              <Route path="/minhas-reservas" element={<MinhasReservas />} />
            </Route>
          </Route>
        </Route>

        {/* Gestão: funcionário cuida do salão; admin também administra. */}
        <Route element={<RotaProtegida />}>
          <Route element={<RotaPorPerfil perfis={['funcionario', 'admin']} />}>
            <Route path="/gestao" element={<LayoutGestao />}>
              <Route index element={<Navigate to="pedidos" replace />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="reservas" element={<Reservas />} />
              <Route element={<RotaPorPerfil perfis={['admin']} />}>
                <Route path="cardapio" element={<Produtos />} />
                <Route path="mesas" element={<Mesas />} />
                <Route path="compras" element={<Compras />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
