import { Chip } from '@mui/material';
import { CORES_STATUS, rotulo } from '../constants/rotulos.js';

// <ChipStatus grupo="statusPedido" valor="em_preparo" />
export default function ChipStatus({ grupo, valor, ...resto }) {
  const cor = CORES_STATUS[grupo]?.[valor] ?? 'default';
  return (
    <Chip
      size="small"
      label={rotulo(grupo, valor)}
      color={cor}
      variant={cor === 'default' || cor === 'error' ? 'outlined' : 'filled'}
      {...resto}
    />
  );
}
