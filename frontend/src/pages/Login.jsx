import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth.js';
import TelaAcesso from '../components/TelaAcesso.jsx';

// Para onde cada perfil vai depois do login, se não estava indo para uma página específica
const inicioDoPerfil = (role) => (role === 'cliente' ? '/minhas-reservas' : '/gestao');

export default function Login() {
  const { usuario, logado, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pedida = location.state?.de;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (logado) return <Navigate to={pedida ?? inicioDoPerfil(usuario.role)} replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const atual = await entrar(email, senha);
      navigate(pedida ?? inicioDoPerfil(atual.role), { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Entrar" texto="Clientes acompanham as reservas. A equipe acessa a gestão do salão.">
      <Stack component="form" spacing={2.5} onSubmit={enviar} noValidate>
        {erro && <Alert severity="error">{erro}</Alert>}
        <TextField label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <TextField label="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Button type="submit" variant="contained" size="large" loading={enviando}>Entrar</Button>
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          Primeira vez aqui?{' '}
          <Link component={RouterLink} to="/cadastro" state={location.state}>Crie sua conta</Link>
        </Typography>
      </Stack>
    </TelaAcesso>
  );
}
