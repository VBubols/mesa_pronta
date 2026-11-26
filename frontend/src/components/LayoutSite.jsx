import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth.js';
import Marca from './Marca.jsx';
import ItemMenu from './ItemMenu.jsx';

// Site do cliente: cardápio, reserva e minhas reservas.
export default function LayoutSite() {
  const { usuario, logado, ehGestao, sair } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 1, sm: 0 } }}>
          <Marca />

          <Box
            component="nav"
            aria-label="Site"
            sx={{ display: 'flex', gap: 0.5, order: { xs: 3, sm: 0 }, width: { xs: '100%', sm: 'auto' }, overflowX: 'auto' }}
          >
            <ItemMenu to="/" end>Cardápio</ItemMenu>
            <ItemMenu to="/reservar">Reservar mesa</ItemMenu>
            {usuario?.role === 'cliente' && <ItemMenu to="/minhas-reservas">Minhas reservas</ItemMenu>}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          {logado ? (
            <>
              <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.8 }}>
                Olá, {usuario.nome}
              </Typography>
              {ehGestao && (
                <Button component={RouterLink} to="/gestao" color="secondary" variant="contained" size="small">
                  Abrir gestão
                </Button>
              )}
              <Button color="inherit" onClick={() => { sair(); navigate('/'); }}>Sair</Button>
            </>
          ) : (
            <Button component={RouterLink} to="/login" color="inherit" variant="outlined" size="small">
              Entrar
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
