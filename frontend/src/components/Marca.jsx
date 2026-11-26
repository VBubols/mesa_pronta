import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';

// Logotipo em texto. `complemento` aparece menor ao lado (ex.: "Gestão").
export default function Marca({ para = '/', complemento, cor = 'inherit' }) {
  return (
    <Box
      component={RouterLink}
      to={para}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, color: cor, textDecoration: 'none', mr: 2 }}
    >
      <RestaurantIcon sx={{ color: 'secondary.main' }} />
      <Typography component="span" sx={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 21, letterSpacing: '-0.02em' }}>
        Mesa Pronta
      </Typography>
      {complemento && (
        <Typography component="span" sx={{ opacity: 0.7, fontSize: 15, fontWeight: 600 }}>
          {complemento}
        </Typography>
      )}
    </Box>
  );
}
