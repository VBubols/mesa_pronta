import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LinearProgress } from '@mui/material';
import Layout from './components/Layout.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import RotaAdmin from './components/RotaAdmin.jsx';
import Login from './pages/Login.jsx';

// Cada tela é baixada só quando é aberta: o login carrega rápido, e o código de
// markdown (detalhe da vaga) e do admin não pesa para quem não usa.
const Cadastro = lazy(() => import('./pages/Cadastro.jsx'));
const Vagas = lazy(() => import('./pages/Vagas.jsx'));
const VagaDetalhe = lazy(() => import('./pages/VagaDetalhe.jsx'));
const Curriculo = lazy(() => import('./pages/Curriculo.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  return (
    <Suspense fallback={<LinearProgress />}>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Exigem login */}
        <Route element={<RotaProtegida />}>
          <Route element={<Layout />}>
            <Route path="/vagas" element={<Vagas />} />
            <Route path="/vagas/:id" element={<VagaDetalhe />} />
            <Route path="/curriculo" element={<Curriculo />} />

            {/* Exigem login de admin */}
            <Route element={<RotaAdmin />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/vagas" replace />} />
      </Routes>
    </Suspense>
  );
}
