import { NavLink } from 'react-router-dom';
import { Button } from '@mui/material';

// Botão de navegação da barra do topo, destacado na página atual.
export default function ItemMenu({ to, end, children }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      color="inherit"
      sx={{
        flexShrink: 0,
        opacity: 0.85,
        '&.active': { opacity: 1, boxShadow: (t) => `inset 0 -3px 0 ${t.palette.secondary.main}`, borderRadius: 0 },
      }}
    >
      {children}
    </Button>
  );
}
