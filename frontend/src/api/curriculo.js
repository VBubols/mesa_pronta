import { http } from './client.js';

// 404 se o usuário ainda não tem currículo.
export const obterCurriculo = () => http.get('/curriculo');
export const criarCurriculo = (dados) => http.post('/curriculo', dados);
export const atualizarCurriculo = (dados) => http.put('/curriculo', dados);

// Baixa o PDF compatível com ATS. Usa o nome de arquivo que o backend sugere.
export async function baixarCurriculoPdf() {
  const { blob, nomeArquivo } = await http.baixar('/curriculo/pdf');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo ?? 'curriculo.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
