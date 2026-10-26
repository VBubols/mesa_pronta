export function montarPaginacao({ pagina, limite, total }) {
  return {
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}
