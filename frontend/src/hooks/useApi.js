import { useCallback, useEffect, useState } from 'react';

// Carrega dados de uma função da API e recarrega quando a função muda.
// Passe a função memorizada com useCallback, com os filtros como dependências:
//   const carregar = useCallback(() => listarVagas({ q }), [q]);
//   const { dados, erro, carregando, recarregar } = useApi(carregar);
// Enquanto uma nova busca carrega, `dados` continua com o resultado anterior,
// para a tela não piscar.
export function useApi(carregar) {
  const [recarga, setRecarga] = useState(0);
  const [estado, setEstado] = useState({ carregar: null, recarga: -1, dados: null, erro: null });

  useEffect(() => {
    let ativo = true;
    carregar().then(
      (dados) => {
        if (ativo) setEstado({ carregar, recarga, dados, erro: null });
      },
      (erro) => {
        if (ativo) setEstado({ carregar, recarga, dados: null, erro });
      },
    );
    return () => {
      ativo = false;
    };
  }, [carregar, recarga]);

  const recarregar = useCallback(() => setRecarga((n) => n + 1), []);
  const carregando = estado.carregar !== carregar || estado.recarga !== recarga;

  return { dados: estado.dados, erro: estado.erro, carregando, recarregar };
}
