import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { criarVagaInterna, editarVagaInterna } from '../../api/admin.js';
import { errosPorCampo } from '../../api/client.js';
import { opcoes } from '../../constants/rotulo.js';
import CampoSkills from '../../components/CampoSkills.jsx';

const texto = (valor) => valor ?? '';

function formInicial(vaga) {
  return {
    titulo: texto(vaga?.titulo),
    empresa: texto(vaga?.empresa),
    link: texto(vaga?.link),
    nivel: texto(vaga?.nivel),
    modalidade: texto(vaga?.modalidade),
    contratacao: texto(vaga?.contratacao),
    stack: texto(vaga?.stack),
    cidade: texto(vaga?.cidade),
    uf: texto(vaga?.uf),
    descricao: texto(vaga?.descricao),
    skills: vaga?.skills ?? [],
  };
}

// Campos opcionais vazios não vão no corpo: o schema do backend rejeita '' em enums.
function paraApi(form) {
  const dados = { ...form, skills: form.skills.map((s) => s.id) };
  for (const opcional of ['contratacao', 'uf', 'cidade', 'descricao']) {
    if (!dados[opcional]) delete dados[opcional];
  }
  return dados;
}

const itens = (grupo, vazio) => [
  ...(vazio ? [<MenuItem key="" value=""><em>{vazio}</em></MenuItem>] : []),
  ...opcoes(grupo).map((o) => <MenuItem key={o.valor} value={o.valor}>{o.rotulo}</MenuItem>),
];

// Criar (vaga = null) ou editar uma vaga interna. O componente é montado de novo
// a cada abertura (key no pai), então o formulário sempre começa com os dados certos.
export default function FormVagaInterna({ vaga, onFechar, onSalvo }) {
  const tema = useTheme();
  const telaCheia = useMediaQuery(tema.breakpoints.down('sm'));
  const [form, setForm] = useState(() => formInicial(vaga));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm((f) => ({ ...f, [nome]: e.target.value })),
    error: Boolean(erros[nome]),
    helperText: erros[nome],
    fullWidth: true,
  });

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErros({});
    setErroGeral('');
    try {
      const salva = vaga ? await editarVagaInterna(vaga.id, paraApi(form)) : await criarVagaInterna(paraApi(form));
      onSalvo(salva);
    } catch (e) {
      const porCampo = errosPorCampo(e);
      setErros(porCampo);
      setErroGeral(Object.keys(porCampo).length ? 'Confira os campos destacados.' : e.message);
    } finally {
      setSalvando(false);
    }
  }

  const remota = form.modalidade === 'remoto';

  return (
    <Dialog open onClose={salvando ? undefined : onFechar} fullWidth maxWidth="md" fullScreen={telaCheia}>
      <form onSubmit={salvar} noValidate>
        <DialogTitle>{vaga ? 'Editar vaga interna' : 'Nova vaga interna'}</DialogTitle>
        <DialogContent dividers>
          {erroGeral && <Alert severity="error" sx={{ mb: 2 }}>{erroGeral}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 7 }}><TextField label="Título da vaga" required autoFocus {...campo('titulo')} /></Grid>
            <Grid size={{ xs: 12, sm: 5 }}><TextField label="Empresa" required {...campo('empresa')} /></Grid>
            <Grid size={12}>
              <TextField label="Link de candidatura" type="url" placeholder="https://" required {...campo('link')} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}><TextField select label="Nível" required {...campo('nivel')}>{itens('niveis')}</TextField></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><TextField select label="Modalidade" required {...campo('modalidade')}>{itens('modalidades')}</TextField></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><TextField select label="Stack" required {...campo('stack')}>{itens('stacks')}</TextField></Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Contratação" {...campo('contratacao')}>{itens('contratacoes', 'Não informar')}</TextField>
            </Grid>
            <Grid size={{ xs: 8, sm: 9 }}>
              <TextField label="Cidade" {...campo('cidade')} helperText={erros.cidade ?? 'Use "Exterior" para vaga fora do Brasil'} />
            </Grid>
            <Grid size={{ xs: 4, sm: 3 }}>
              <TextField
                select
                label="UF"
                required={!remota && form.cidade !== 'Exterior'}
                {...campo('uf')}
              >
                {itens('ufs', 'Sem UF')}
              </TextField>
            </Grid>
            <Grid size={12}>
              <CampoSkills
                value={form.skills}
                onChange={(skills) => setForm((f) => ({ ...f, skills }))}
                label="Skills pedidas"
                error={Boolean(erros.skills)}
                helperText={erros.skills}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descrição"
                multiline
                minRows={5}
                {...campo('descricao')}
                helperText={erros.descricao ?? 'Aceita markdown: ## Título, - lista, **negrito**'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={salvando}>{vaga ? 'Salvar alterações' : 'Publicar vaga'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
