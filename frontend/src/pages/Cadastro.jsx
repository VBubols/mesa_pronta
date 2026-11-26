import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Grid, Link, Stack, TextField, Typography } from '@mui/material';
import { cadastrar } from '../api/auth.js';
import { errosPorCampo } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { mascaraTelefone } from '../utils/formatos.js';
import TelaAcesso from '../components/TelaAcesso.jsx';

const VAZIO = { nome: '', sobrenome: '', email: '', telefoneCelular: '', senha: '', confirmarSenha: '' };

// Cadastro de cliente. Funcionários são cadastrados pelo admin, na gestão.
export default function Cadastro() {
  const { logado, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Só quem já chega logado é redirecionado. Sem isso, o login automático depois do
  // cadastro dispararia esse redirecionamento antes da navegação abaixo.
  const [jaChegouLogado] = useState(logado);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (jaChegouLogado) return <Navigate to="/" replace />;

  const campo = (nome, mascara) => ({
    name: nome,
    value: form[nome],
    onChange: (e) => setForm((atual) => ({ ...atual, [nome]: mascara ? mascara(e.target.value) : e.target.value })),
    error: Boolean(erros[nome]),
    helperText: erros[nome],
    fullWidth: true,
  });

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral('');
    if (form.senha !== form.confirmarSenha) {
      setErros({ confirmarSenha: 'As senhas não conferem' });
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const dados = { ...form };
      delete dados.confirmarSenha; // a confirmação só existe na tela
      await cadastrar(dados);
      await entrar(form.email, form.senha);
      navigate(location.state?.de ?? '/reservar', { replace: true });
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErros(porCampo);
      setErroGeral(Object.keys(porCampo).length ? 'Confira os campos destacados.' : e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Criar conta" texto="Com a conta você reserva mesa e pode pagar o pedido antes de chegar." larguraMaxima={560}>
      <Stack component="form" spacing={3} onSubmit={enviar} noValidate>
        {erroGeral && <Alert severity="error">{erroGeral}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Nome" autoComplete="given-name" required autoFocus {...campo('nome')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Sobrenome" autoComplete="family-name" required {...campo('sobrenome')} />
          </Grid>
          <Grid size={12}>
            <TextField label="E-mail" type="email" autoComplete="email" required {...campo('email')} />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Celular"
              inputMode="tel"
              placeholder="(48) 99999-9999"
              autoComplete="tel"
              required
              {...campo('telefoneCelular', mascaraTelefone)}
              helperText={erros.telefoneCelular ?? 'Para o restaurante falar com você sobre a reserva'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Senha" type="password" autoComplete="new-password" required {...campo('senha')}
              helperText={erros.senha ?? 'Pelo menos 6 caracteres'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Confirmar senha" type="password" autoComplete="new-password" required {...campo('confirmarSenha')} />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" size="large" loading={enviando}>Criar conta</Button>
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          Já tem conta?{' '}
          <Link component={RouterLink} to="/login" state={location.state}>Entrar</Link>
        </Typography>
      </Stack>
    </TelaAcesso>
  );
}
