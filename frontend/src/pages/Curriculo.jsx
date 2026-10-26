import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, FormControl, FormControlLabel, FormGroup,
  FormHelperText, FormLabel, Grid, MenuItem, Paper, Snackbar, Stack, TextField, Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import {
  atualizarCurriculo, baixarCurriculoPdf, criarCurriculo, obterCurriculo,
} from '../api/curriculo.js';
import { errosPorCampo } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { opcoes } from '../constants/rotulo.js';
import { mascaraTelefone } from '../utils/formatos.js';
import CampoSkills from '../components/CampoSkills.jsx';
import ListaEditavel from './curriculo/ListaEditavel.jsx';
import { LIMITES, NOVOS, curriculoVazio, deApi, paraApi } from './curriculo/modelo.js';

function Secao({ titulo, descricao, erro, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h2">{titulo}</Typography>
      {descricao && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{descricao}</Typography>}
      {!descricao && <Box sx={{ mb: 2 }} />}
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {children}
    </Paper>
  );
}

function SeloCompletude({ pronto, texto }) {
  return (
    <Chip
      size="small"
      variant={pronto ? 'filled' : 'outlined'}
      color={pronto ? 'success' : 'default'}
      icon={pronto ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
      label={texto}
    />
  );
}

// Select do MUI a partir de um grupo de rotulo.js. vazio = opção "não informar".
function opcoesSelect(grupo, vazio) {
  return [
    ...(vazio ? [<MenuItem key="" value=""><em>{vazio}</em></MenuItem>] : []),
    ...opcoes(grupo).map((o) => <MenuItem key={o.valor} value={o.valor}>{o.rotulo}</MenuItem>),
  ];
}

const mes = { type: 'month', slotProps: { inputLabel: { shrink: true } } };

export default function Curriculo() {
  const { usuario } = useAuth();
  const location = useLocation();

  const [carregamento, setCarregamento] = useState({ carregando: true, erro: null });
  const [form, setForm] = useState(null); // null = ainda não editado: usa o currículo vazio
  const [existe, setExiste] = useState(false);
  const [completude, setCompletude] = useState(null);
  const [alterado, setAlterado] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let ativo = true;
    obterCurriculo().then(
      (cv) => {
        if (!ativo) return;
        setForm(deApi(cv));
        setExiste(true);
        setCompletude(cv.completude);
        setCarregamento({ carregando: false, erro: null });
      },
      (erro) => {
        if (!ativo) return;
        // 404 = ainda não tem currículo: o formulário começa vazio
        setCarregamento({ carregando: false, erro: erro.status === 404 ? null : erro });
      },
    );
    return () => {
      ativo = false;
    };
  }, []);

  const cv = form ?? curriculoVazio(usuario);

  function alterar(mudar) {
    setForm((atual) => mudar(atual ?? curriculoVazio(usuario)));
    setAlterado(true);
  }
  const definir = (campo, valor) => alterar((f) => ({ ...f, [campo]: valor }));
  const definirItem = (lista, indice, campo, valor) => alterar((f) => ({
    ...f,
    [lista]: f[lista].map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)),
  }));
  const adicionar = (lista) => alterar((f) => ({ ...f, [lista]: [...f[lista], NOVOS[lista]()] }));
  const remover = (lista, indice) => alterar((f) => ({ ...f, [lista]: f[lista].filter((_, i) => i !== indice) }));

  // Props comuns de um campo de texto. Os erros chegam do backend com o caminho do campo
  // ('telefone', 'experiencias.0.fim'...).
  const campo = (nome, mascara) => ({
    value: cv[nome],
    onChange: (e) => definir(nome, mascara ? mascara(e.target.value) : e.target.value),
    error: Boolean(erros[nome]),
    helperText: erros[nome],
    fullWidth: true,
  });
  const campoItem = (lista, indice, nome) => ({
    value: cv[lista][indice][nome],
    onChange: (e) => definirItem(lista, indice, nome, e.target.value),
    error: Boolean(erros[`${lista}.${indice}.${nome}`]),
    helperText: erros[`${lista}.${indice}.${nome}`],
    fullWidth: true,
    size: 'small',
  });

  async function salvar() {
    setSalvando(true);
    setErros({});
    setErroGeral('');
    try {
      const salvo = await (existe ? atualizarCurriculo : criarCurriculo)(paraApi(cv));
      setForm(deApi(salvo));
      setExiste(true);
      setCompletude(salvo.completude);
      setAlterado(false);
      setAviso({ tipo: 'success', texto: 'Currículo salvo.' });
    } catch (e) {
      const porCampo = errosPorCampo(e);
      const quantos = Object.keys(porCampo).length;
      setErros(porCampo);
      setErroGeral(quantos ? `Confira ${quantos === 1 ? 'o campo destacado' : `os ${quantos} campos destacados`}.` : e.message);
      // leva a pessoa até o primeiro campo com erro
      requestAnimationFrame(() => {
        const primeiro = document.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } finally {
      setSalvando(false);
    }
  }

  async function exportar() {
    setBaixando(true);
    try {
      await baixarCurriculoPdf();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setBaixando(false);
    }
  }

  if (carregamento.carregando) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (carregamento.erro) return <Alert severity="error">{carregamento.erro.message}</Alert>;

  const botoes = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={salvar} loading={salvando}>
        {existe ? 'Salvar alterações' : 'Salvar currículo'}
      </Button>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdfOutlinedIcon />}
        onClick={exportar}
        loading={baixando}
        disabled={!existe}
      >
        Exportar PDF
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={3} sx={{ pb: { xs: 20, sm: 10 } }}>
      <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>Meu currículo</Typography>
          <Typography color="text.secondary">
            Preencha uma vez: ele alimenta as recomendações de vagas e gera o PDF compatível com ATS.
          </Typography>
          {existe && completude && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              <SeloCompletude pronto={completude.match} texto={completude.match ? 'Pronto para recomendações' : 'Faltam dados para recomendações'} />
              <SeloCompletude pronto={completude.pdf} texto={completude.pdf ? 'Pronto para o PDF' : 'Faltam dados para o PDF'} />
            </Stack>
          )}
      </Box>

      {location.state?.boasVindas && !existe && (
        <Alert severity="success">Conta criada! Agora preencha o seu currículo para receber recomendações de vagas.</Alert>
      )}
      {erroGeral && <Alert severity="error">{erroGeral}</Alert>}

      <Secao titulo="Dados pessoais e contato" descricao="Aparecem no topo do PDF.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nome completo" required {...campo('nomeCompleto')} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Título profissional" placeholder="Ex.: Desenvolvedor Front-end Júnior" required {...campo('titulo')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="E-mail de contato" type="email" required {...campo('emailContato')} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Telefone" inputMode="tel" placeholder="(48) 99999-9999" required {...campo('telefone', mascaraTelefone)} />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Resumo profissional"
              multiline
              minRows={3}
              required
              {...campo('resumo')}
              helperText={erros.resumo ?? `${cv.resumo.length} de ${LIMITES.resumo} caracteres`}
              slotProps={{ htmlInput: { maxLength: LIMITES.resumo } }}
            />
          </Grid>
        </Grid>
      </Secao>

      <Secao titulo="Preferências para as recomendações" descricao="Usadas para filtrar as vagas que combinam com você.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select label="Nível" required {...campo('nivel')}>{opcoesSelect('niveis')}</TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}><TextField label="Cidade onde mora" required {...campo('cidade')} /></Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField select label="UF" required {...campo('uf')}>{opcoesSelect('ufs')}</TextField>
          </Grid>
          <Grid size={12}>
            <FormControl error={Boolean(erros.modalidades)} required>
              <FormLabel>Modalidades que aceita</FormLabel>
              <FormGroup row>
                {opcoes('modalidades').map((o) => (
                  <FormControlLabel
                    key={o.valor}
                    label={o.rotulo}
                    control={(
                      <Checkbox
                        checked={cv.modalidades.includes(o.valor)}
                        onChange={(e) => definir('modalidades', e.target.checked
                          ? [...cv.modalidades, o.valor]
                          : cv.modalidades.filter((m) => m !== o.valor))}
                      />
                    )}
                  />
                ))}
              </FormGroup>
              {erros.modalidades && <FormHelperText>{erros.modalidades}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Outras cidades onde aceita trabalhar presencialmente</Typography>
            <ListaEditavel
              itens={cv.locais}
              max={LIMITES.locais}
              rotuloItem="Cidade"
              textoAdicionar="Adicionar cidade"
              textoVazio="Nenhuma além da cidade onde mora."
              onAdicionar={() => adicionar('locais')}
              onRemover={(i) => remover('locais', i)}
              renderItem={(_, i) => (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 8 }}><TextField label="Cidade" {...campoItem('locais', i, 'cidade')} /></Grid>
                  <Grid size={{ xs: 4 }}>
                    <TextField select label="UF" {...campoItem('locais', i, 'uf')}>{opcoesSelect('ufs')}</TextField>
                  </Grid>
                </Grid>
              )}
            />
          </Grid>
        </Grid>
      </Secao>

      <Secao titulo="Skills" descricao="O match compara estas skills com as que cada vaga pede.">
        <CampoSkills
          value={cv.skills}
          onChange={(skills) => definir('skills', skills)}
          max={LIMITES.skills}
          error={Boolean(erros.skills)}
          helperText={erros.skills}
        />
      </Secao>

      <Secao titulo="Experiência profissional" descricao="Estágios e trabalhos, do mais recente para o mais antigo.">
        <ListaEditavel
          itens={cv.experiencias}
          max={LIMITES.experiencias}
          rotuloItem="Experiência"
          textoAdicionar="Adicionar experiência"
          textoVazio="Nenhuma experiência ainda. Tudo bem para quem está começando: destaque cursos e projetos."
          onAdicionar={() => adicionar('experiencias')}
          onRemover={(i) => remover('experiencias', i)}
          renderItem={(item, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Cargo" required {...campoItem('experiencias', i, 'cargo')} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Empresa" required {...campoItem('experiencias', i, 'empresa')} /></Grid>
              <Grid size={{ xs: 8, sm: 4 }}><TextField label="Cidade" {...campoItem('experiencias', i, 'cidade')} /></Grid>
              <Grid size={{ xs: 4, sm: 2 }}>
                <TextField select label="UF" {...campoItem('experiencias', i, 'uf')}>{opcoesSelect('ufs', 'Não informar')}</TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}><TextField label="Início" required {...mes} {...campoItem('experiencias', i, 'inicio')} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Fim" {...mes} {...campoItem('experiencias', i, 'fim')} disabled={item.atual} />
              </Grid>
              <Grid size={12}>
                <FormControlLabel
                  label="Trabalho aqui atualmente"
                  control={<Checkbox checked={item.atual} onChange={(e) => definirItem('experiencias', i, 'atual', e.target.checked)} />}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="O que você fazia"
                  multiline
                  minRows={2}
                  {...campoItem('experiencias', i, 'descricao')}
                  slotProps={{ htmlInput: { maxLength: LIMITES.descricaoExperiencia } }}
                />
              </Grid>
            </Grid>
          )}
        />
      </Secao>

      <Secao titulo="Formação acadêmica" erro={erros.formacoes}>
        <ListaEditavel
          itens={cv.formacoes}
          max={LIMITES.formacoes}
          rotuloItem="Formação"
          textoAdicionar="Adicionar formação"
          textoVazio="Nenhuma formação adicionada. O PDF precisa de pelo menos uma."
          onAdicionar={() => adicionar('formacoes')}
          onRemover={(i) => remover('formacoes', i)}
          renderItem={(_, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Curso" required {...campoItem('formacoes', i, 'curso')} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Instituição" required {...campoItem('formacoes', i, 'instituicao')} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField select label="Grau" required {...campoItem('formacoes', i, 'grau')}>{opcoesSelect('graus')}</TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField select label="Situação" required {...campoItem('formacoes', i, 'situacao')}>{opcoesSelect('situacoesFormacao')}</TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}><TextField label="Início" {...mes} {...campoItem('formacoes', i, 'inicio')} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Conclusão ou previsão" {...mes} {...campoItem('formacoes', i, 'fim')} />
              </Grid>
            </Grid>
          )}
        />
      </Secao>

      <Secao titulo="Cursos e certificações" erro={erros.cursos}>
        <ListaEditavel
          itens={cv.cursos}
          max={LIMITES.cursos}
          rotuloItem="Curso"
          textoAdicionar="Adicionar curso"
          textoVazio="Nenhum curso adicionado."
          onAdicionar={() => adicionar('cursos')}
          onRemover={(i) => remover('cursos', i)}
          renderItem={(_, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nome do curso" required {...campoItem('cursos', i, 'nome')} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Instituição" {...campoItem('cursos', i, 'instituicao')} /></Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Carga horária (h)" type="number" {...campoItem('cursos', i, 'cargaHoraria')} slotProps={{ htmlInput: { min: 1 } }} />
              </Grid>
              <Grid size={{ xs: 6 }}><TextField label="Conclusão" {...mes} {...campoItem('cursos', i, 'conclusao')} /></Grid>
            </Grid>
          )}
        />
      </Secao>

      <Secao titulo="Idiomas" erro={erros.idiomas}>
        <ListaEditavel
          itens={cv.idiomas}
          max={LIMITES.idiomas}
          rotuloItem="Idioma"
          textoAdicionar="Adicionar idioma"
          textoVazio="Nenhum idioma adicionado."
          onAdicionar={() => adicionar('idiomas')}
          onRemover={(i) => remover('idiomas', i)}
          renderItem={(_, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 7 }}><TextField label="Idioma" required {...campoItem('idiomas', i, 'idioma')} /></Grid>
              <Grid size={{ xs: 5 }}>
                <TextField select label="Nível" required {...campoItem('idiomas', i, 'nivel')}>{opcoesSelect('niveisIdioma')}</TextField>
              </Grid>
            </Grid>
          )}
        />
      </Secao>

      <Secao titulo="Links" descricao="GitHub, LinkedIn e portfólio." erro={erros.links}>
        <ListaEditavel
          itens={cv.links}
          max={LIMITES.links}
          rotuloItem="Link"
          textoAdicionar="Adicionar link"
          textoVazio="Nenhum link adicionado."
          onAdicionar={() => adicionar('links')}
          onRemover={(i) => remover('links', i)}
          renderItem={(_, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select label="Tipo" required {...campoItem('links', i, 'tipo')}>{opcoesSelect('tiposLink')}</TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField label="URL" type="url" placeholder="https://" required {...campoItem('links', i, 'url')} />
              </Grid>
            </Grid>
          )}
        />
      </Secao>

      <Secao titulo="Projetos" descricao="Para quem está começando, projetos pessoais e acadêmicos contam muito." erro={erros.projetos}>
        <ListaEditavel
          itens={cv.projetos}
          max={LIMITES.projetos}
          rotuloItem="Projeto"
          textoAdicionar="Adicionar projeto"
          textoVazio="Nenhum projeto adicionado."
          onAdicionar={() => adicionar('projetos')}
          onRemover={(i) => remover('projetos', i)}
          renderItem={(item, i) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nome do projeto" required {...campoItem('projetos', i, 'nome')} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="URL (opcional)" type="url" placeholder="https://" {...campoItem('projetos', i, 'url')} />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Descrição"
                  multiline
                  minRows={2}
                  {...campoItem('projetos', i, 'descricao')}
                  slotProps={{ htmlInput: { maxLength: LIMITES.descricaoProjeto } }}
                />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  size="small"
                  options={[]}
                  value={item.tecnologias}
                  onChange={(_, valores) => definirItem('projetos', i, 'tecnologias', valores.map((v) => v.trim()).filter(Boolean).slice(0, LIMITES.tecnologias))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tecnologias"
                      error={Boolean(erros[`projetos.${i}.tecnologias`])}
                      helperText={erros[`projetos.${i}.tecnologias`] ?? 'Digite e aperte Enter para adicionar'}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}
        />
      </Secao>

      {/* Barra fixa: salvar fica sempre à mão em um formulário longo */}
      <Paper
        elevation={6}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.appBar,
          px: 2, py: 1.5, borderRadius: 0,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ maxWidth: 'lg', mx: 'auto', justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography variant="body2" color="text.secondary">
            {alterado ? 'Você tem alterações não salvas.' : existe ? 'Tudo salvo. O PDF usa a última versão salva.' : 'Currículo ainda não salvo.'}
          </Typography>
          {botoes}
        </Stack>
      </Paper>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={aviso?.tipo ?? 'success'} variant="filled" onClose={() => setAviso(null)}>
          {aviso?.texto}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
