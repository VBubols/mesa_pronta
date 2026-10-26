import { useCallback, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { buscarSkills } from '../api/skills.js';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';

// Autocomplete de skills ligado ao GET /skills?busca=.
// value e onChange trabalham com a lista de objetos { id, nome }.
export default function CampoSkills({ value, onChange, label = 'Skills', max = 30, error, helperText, ...props }) {
  const [entrada, setEntrada] = useState('');
  const termo = useDebounce(entrada.trim(), 250);
  const carregar = useCallback(() => buscarSkills(termo), [termo]);
  const { dados, carregando } = useApi(carregar);

  return (
    <Autocomplete
      multiple
      filterSelectedOptions
      options={dados ?? []}
      value={value}
      onChange={(_, novas) => onChange(novas.slice(0, max))}
      inputValue={entrada}
      onInputChange={(_, texto) => setEntrada(texto)}
      getOptionLabel={(skill) => skill.nome}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opcoes) => opcoes} // o backend já filtra (inclusive por apelidos: "js", "nodejs")
      loading={carregando}
      loadingText="Buscando..."
      noOptionsText="Nenhuma skill encontrada"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText ?? `${value.length} de ${max}. Digite para buscar (ex.: react, node, sql).`}
        />
      )}
      {...props}
    />
  );
}
