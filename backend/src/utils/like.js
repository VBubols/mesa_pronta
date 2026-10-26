// Escapa % _ \ para uso seguro dentro de um LIKE/ILIKE.
export function escaparLike(valor) {
  return String(valor).replace(/[\\%_]/g, (c) => `\\${c}`);
}
