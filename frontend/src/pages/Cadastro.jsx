import { useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Grid, Link, Stack, TextField, Typography,
} from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import { cadastrar } from '../api/auth.js';
import { errosPorCampo } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { PAISES } from '../constants/paises.js';
import { mascaraCpf, mascaraTelefone } from '../utils/formatos.js';

const VAZIO = {
  nome: '',
  sobrenome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  cpf: '',
  telefoneCelular: '',
  telefoneFixo: '',
  dataNascimento: '',
  paisOrigem: 'BR',
};

export default function Cadastro() {
  const { logado, entrar } = useAuth();
  const navigate = useNavigate();
  // Só quem já chega logado é mandado para /vagas. Sem isso, o login automático
  // depois do cadastro dispararia esse redirecionamento antes de ir para /curriculo.
  const [jaChegouLogado] = useState(logado);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (jaChegouLogado) return <Navigate to="/vagas" replace />;

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
      delete dados.confirmarSenha; // só existe na tela, o backend não recebe
      await cadastrar(dados);
      await entrar(form.email, form.senha);
      navigate('/curriculo', { replace: true, state: { boasVindas: true } });
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErros(porCampo);
      setErroGeral(Object.keys(porCampo).length ? 'Confira os campos destacados.' : e.message);
    } finally {
      setEnviando(false);
    }
  }

  const paisSelecionado = PAISES.find((p) => p.codigo === form.paisOrigem) ?? null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', px: 2, py: 4 }}>
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack component="form" spacing={3} onSubmit={enviar} noValidate>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
                <WorkOutlineIcon />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                  Criar conta
                </Typography>
              </Stack>
              <Typography color="text.secondary">
                Depois do cadastro você preenche o currículo e recebe as vagas que combinam com você.
              </Typography>
            </Stack>

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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Senha" type="password" autoComplete="new-password" required {...campo('senha')}
                  helperText={erros.senha ?? 'Pelo menos 6 caracteres'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Confirmar senha" type="password" autoComplete="new-password" required {...campo('confirmarSenha')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="CPF" inputMode="numeric" placeholder="000.000.000-00" required {...campo('cpf', mascaraCpf)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data de nascimento"
                  type="date"
                  required
                  {...campo('dataNascimento')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Celular" inputMode="tel" placeholder="(48) 99999-9999" autoComplete="tel" required
                  {...campo('telefoneCelular', mascaraTelefone)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Telefone fixo (opcional)" inputMode="tel" placeholder="(48) 3333-4444"
                  {...campo('telefoneFixo', mascaraTelefone)} />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  options={PAISES}
                  value={paisSelecionado}
                  onChange={(_, pais) => setForm((atual) => ({ ...atual, paisOrigem: pais?.codigo ?? '' }))}
                  getOptionLabel={(pais) => pais.nome}
                  isOptionEqualToValue={(a, b) => a.codigo === b.codigo}
                  renderInput={(params) => (
                    <TextField {...params} label="País de origem" required error={Boolean(erros.paisOrigem)} helperText={erros.paisOrigem} />
                  )}
                />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" loading={enviando}>
              Criar conta
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Já tem conta?{' '}
              <Link component={RouterLink} to="/login">
                Entrar
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
