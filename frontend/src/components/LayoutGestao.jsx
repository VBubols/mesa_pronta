import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth.js';
import { rotulo } from '../constants/rotulos.js';
import Marca from './Marca.jsx';
import ItemMenu from './ItemMenu.jsx';

// Área de gestão. Funcionário vê o salão (pedidos e reservas); admin vê também a administração.
export default function LayoutGestao() {
  const { usuario, ehAdmin, sair } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 1, md: 0 } }}>
          <Marca para="/gestao" complemento="Gestão" />

          <Box
            component="nav"
            aria-label="Gestão"
            sx={{ display: 'flex', gap: 0.5, order: { xs: 3, md: 0 }, width: { xs: '100%', md: 'auto' }, overflowX: 'auto' }}
          >
            <ItemMenu to="/gestao/pedidos">Pedidos</ItemMenu>
            <ItemMenu to="/gestao/reservas">Reservas</ItemMenu>
            {ehAdmin && (
              <>
                <ItemMenu to="/gestao/cardapio">Cardápio</ItemMenu>
                <ItemMenu to="/gestao/mesas">Mesas</ItemMenu>
                <ItemMenu to="/gestao/compras">Compras</ItemMenu>
                <ItemMenu to="/gestao/financeiro">Financeiro</ItemMenu>
                <ItemMenu to="/gestao/usuarios">Equipe e clientes</ItemMenu>
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, opacity: 0.8 }}>
            {usuario?.nome} ({rotulo('perfis', usuario?.role).toLowerCase()})
          </Typography>
          <Button component={RouterLink} to="/" color="inherit" size="small" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Ver site</Button>
          <Button color="inherit" onClick={() => { sair(); navigate('/login'); }}>Sair</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
