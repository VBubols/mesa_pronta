// Países para o cadastro: o backend aceita qualquer código ISO de 2 letras
// que o Intl reconhece. A lista é gerada a partir do próprio navegador.
const nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region', fallback: 'none' });
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const PAISES = [...LETRAS]
  .flatMap((a) => [...LETRAS].map((b) => a + b))
  .map((codigo) => ({ codigo, nome: nomes.of(codigo) }))
  .filter((pais) => pais.nome && pais.nome !== pais.codigo)
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
