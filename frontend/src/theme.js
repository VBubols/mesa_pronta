import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Tema único do app. O ptBR traduz os textos internos dos componentes
// ("Sem opções" no Autocomplete, "Linhas por página" na paginação...).
export const tema = createTheme(
  {
    palette: {
      primary: { main: '#1f5fbf' },
      secondary: { main: '#0f8a6a' },
      background: { default: '#f5f7fb' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", system-ui, -apple-system, sans-serif',
      button: { textTransform: 'none', fontWeight: 600 },
    },
  },
  ptBR,
);
