import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import { useAuth } from '../hooks/useAuth.js';

// Botão de navegação que fica destacado na página atual.
function ItemMenu({ to, children }) {
  return (
    <Button
      component={NavLink}
      to={to}
      color="inherit"
      sx={{ '&.active': { bgcolor: 'rgba(255, 255, 255, 0.16)' } }}
    >
      {children}
    </Button>
  );
}

export default function Layout() {
  const { usuario, ehAdmin, sair } = useAuth();
  const navigate = useNavigate();

  function deslogar() {
    sair();
    navigate('/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 1, sm: 0 } }}>
          <WorkOutlineIcon />
          <Typography variant="h6" component="span" sx={{ mr: 2, fontWeight: 600 }}>
            Portal de Vagas
          </Typography>

          {/* No celular o menu desce para uma segunda linha, com largura total */}
          <Box
            component="nav"
            sx={{ display: 'flex', gap: 1, order: { xs: 3, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
          >
            <ItemMenu to="/vagas">Vagas</ItemMenu>
            <ItemMenu to="/curriculo">Meu currículo</ItemMenu>
            {ehAdmin && <ItemMenu to="/admin">Admin</ItemMenu>}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Olá, {usuario?.nome}
          </Typography>
          <Button color="inherit" onClick={deslogar}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
