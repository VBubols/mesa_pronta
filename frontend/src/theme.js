import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Paleta de cozinha: verde manjericão como cor da casa, açafrão para o que pede
// atenção (pedido em preparo, taxa do garçom) e um fundo verde-acinzentado claro,
// para o branco das comandas e do cardápio se destacar como papel.
export const CORES = {
  manjericao: '#2F6B4F',
  manjericaoEscuro: '#1F4D38',
  acafrao: '#E0A32E',
  tinta: '#1E2B27',
  fundo: '#EEF2EE',
  papel: '#FFFFFF',
  linha: '#D5DDD7',
};

const titulos = '"Bricolage Grotesque", "Source Sans 3", system-ui, sans-serif';

// O ptBR traduz os textos internos dos componentes ("Linhas por página", "Sem opções"...).
export const tema = createTheme(
  {
    palette: {
      primary: { main: CORES.manjericao, dark: CORES.manjericaoEscuro, contrastText: '#FFFFFF' },
      secondary: { main: CORES.acafrao, contrastText: '#2A2112' },
      background: { default: CORES.fundo, paper: CORES.papel },
      text: { primary: CORES.tinta, secondary: '#56665F' },
      divider: CORES.linha,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: 15,
      h1: { fontFamily: titulos, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: titulos, fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: titulos, fontWeight: 700, letterSpacing: '-0.015em' },
      h4: { fontFamily: titulos, fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontFamily: titulos, fontWeight: 600 },
      h6: { fontFamily: titulos, fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: { root: { backgroundColor: CORES.tinta } },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 12 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  },
  ptBR,
);
