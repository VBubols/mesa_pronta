import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const { logado, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.de ?? '/vagas';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (logado) return <Navigate to={destino} replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate(destino, { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack component="form" spacing={2.5} onSubmit={enviar} noValidate>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
              <WorkOutlineIcon />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                Portal de Vagas
              </Typography>
            </Stack>
            <Typography color="text.secondary">Entre para ver as vagas que combinam com você.</Typography>

            {erro && <Alert severity="error">{erro}</Alert>}

            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" size="large" loading={enviando}>
              Entrar
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Ainda não tem conta?{' '}
              <Link component={RouterLink} to="/cadastro">
                Cadastre-se
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
