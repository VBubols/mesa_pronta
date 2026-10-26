import { Chip } from '@mui/material';

// % de match da vaga. null = a vaga não tem skills cadastradas para comparar.
export default function ChipCompatibilidade({ valor, size = 'small' }) {
  if (valor === null || valor === undefined) {
    return <Chip size={size} variant="outlined" label="Sem skills para comparar" />;
  }
  const cor = valor >= 70 ? 'success' : valor >= 40 ? 'warning' : 'default';
  return <Chip size={size} color={cor} label={`${valor}% compatível`} sx={{ fontWeight: 600 }} />;
}
