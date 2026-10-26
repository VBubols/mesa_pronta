import { useEffect, useState } from 'react';

// Devolve o valor só depois de ele ficar parado por `atraso` ms (útil em buscas).
export function useDebounce(valor, atraso = 300) {
  const [estavel, setEstavel] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setEstavel(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return estavel;
}
