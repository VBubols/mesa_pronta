import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import Sincronizacao from './admin/Sincronizacao.jsx';
import VagasAdmin from './admin/VagasAdmin.jsx';
import UsuariosAdmin from './admin/UsuariosAdmin.jsx';

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const aba = params.get('aba') === 'usuarios' ? 'usuarios' : 'vagas';
  const [versaoVagas, setVersaoVagas] = useState(0);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>Administração</Typography>
        <Typography color="text.secondary">Vagas do portal e do GitHub, e contas de usuário.</Typography>
      </Box>

      <Sincronizacao onConcluir={() => setVersaoVagas((v) => v + 1)} />

      <Tabs value={aba} onChange={(_, nova) => setParams(nova === 'usuarios' ? { aba: nova } : {})}>
        <Tab value="vagas" label="Vagas" />
        <Tab value="usuarios" label="Usuários" />
      </Tabs>

      {aba === 'vagas' ? <VagasAdmin versao={versaoVagas} /> : <UsuariosAdmin />}
    </Stack>
  );
}
