import { InputAdornment, TextField } from '@mui/material';

// Campo de valor em reais. Guarda o texto digitado ("34,90"); quem usa converte
// com paraCentavos() de utils/formatos.js na hora de enviar.
export default function CampoDinheiro(props) {
  return (
    <TextField
      inputMode="decimal"
      placeholder="0,00"
      {...props}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
    />
  );
}
