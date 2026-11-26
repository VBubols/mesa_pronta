import { useCallback, useState } from 'react';
import {
  Alert, Box, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { resumoFinanceiro } from '../../api/financeiro.js';
import { useApi } from '../../hooks/useApi.js';
import { rotulo } from '../../constants/rotulos.js';
import { dataBr, hoje, limitesDoMes, reais } from '../../utils/formatos.js';
import SeletorMes from '../../components/SeletorMes.jsx';
import { CORES } from '../../theme.js';

function Numero({ rotulo: texto, valor, detalhe, cor }) {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1, minWidth: 180 }}>
      <Typography color="text.secondary">{texto}</Typography>
      <Typography sx={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: { xs: 28, sm: 32 }, color: cor, fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </Typography>
      {detalhe && <Typography variant="body2" color="text.secondary">{detalhe}</Typography>}
    </Box>
  );
}

function Secao({ titulo, texto, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h2">{titulo}</Typography>
      {texto && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{texto}</Typography>}
      {children}
    </Paper>
  );
}

const numeroCelula = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

export default function Financeiro() {
  const mesAtual = hoje().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const { dados: r, erro, carregando } = useApi(useCallback(() => resumoFinanceiro(limitesDoMes(mes)), [mes]));
  const maiorForma = Math.max(1, ...(r?.porFormaPagamento ?? []).map((f) => f.totalCentavos));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">Financeiro</Typography>
        <Typography color="text.secondary">
          Vendas pela data do pagamento, sem os pedidos cancelados. Os 10% ficam fora da receita: são dos garçons.
        </Typography>
      </Box>

      <SeletorMes mes={mes} onChange={setMes} maximo={mesAtual} />
      {erro && <Alert severity="error">{erro.message}</Alert>}
      {carregando && <LinearProgress />}

      {r && (
        <>
          <Paper variant="outlined" sx={{ display: 'flex', flexWrap: 'wrap', '& > * + *': { borderLeft: { sm: `1px solid ${CORES.linha}` } } }}>
            <Numero rotulo="Vendas" valor={reais(r.receitaCentavos)}
              detalhe={`${r.pedidosPagos} ${r.pedidosPagos === 1 ? 'pedido pago' : 'pedidos pagos'}, ticket médio ${reais(r.ticketMedioCentavos)}`} />
            <Numero rotulo="Compras" valor={reais(r.despesasCentavos)} detalhe={`${r.compras} ${r.compras === 1 ? 'compra' : 'compras'} de alimentos`} />
            <Numero rotulo="Saldo" valor={reais(r.saldoCentavos)} cor={r.saldoCentavos < 0 ? 'error.main' : 'primary.main'} detalhe="Vendas menos compras" />
            <Numero rotulo="Serviço dos garçons" valor={reais(r.taxaServicoCentavos)} detalhe="Os 10% a repassar" />
          </Paper>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
            <Secao titulo="Repasse por garçom" texto="Os 10% dos pedidos que cada um atendeu.">
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Garçom</TableCell><TableCell align="right">Pedidos</TableCell><TableCell align="right">10%</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {r.porGarcom.map((g) => (
                    <TableRow key={g.garcomId ?? 'sem'}>
                      <TableCell sx={{ color: g.garcomId ? 'text.primary' : 'text.secondary' }}>{g.nome}</TableCell>
                      <TableCell align="right" sx={numeroCelula}>{g.pedidos}</TableCell>
                      <TableCell align="right" sx={{ ...numeroCelula, fontWeight: 700 }}>{reais(g.taxaServicoCentavos)}</TableCell>
                    </TableRow>
                  ))}
                  {!r.porGarcom.length && <TableRow><TableCell colSpan={3} sx={{ color: 'text.secondary' }}>Sem vendas no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {r.porGarcom.some((g) => !g.garcomId) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Compras antecipadas ganham o garçom no check-in da reserva.
                </Typography>
              )}
            </Secao>

            <Secao titulo="Formas de pagamento" texto="Total recebido, com os 10%.">
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {r.porFormaPagamento.map((f) => (
                  <Box key={f.formaPagamento}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography>{rotulo('formasPagamento', f.formaPagamento)} <Typography component="span" color="text.secondary">({f.pedidos})</Typography></Typography>
                      <Typography sx={{ ...numeroCelula, fontWeight: 700 }}>{reais(f.totalCentavos)}</Typography>
                    </Stack>
                    <Box sx={{ height: 6, bgcolor: 'background.default', borderRadius: 3, mt: 0.5 }}>
                      <Box sx={{ height: 6, width: `${(f.totalCentavos / maiorForma) * 100}%`, bgcolor: 'secondary.main', borderRadius: 3 }} />
                    </Box>
                  </Box>
                ))}
                {!r.porFormaPagamento.length && <Typography color="text.secondary">Sem vendas no período.</Typography>}
              </Stack>
            </Secao>
          </Box>

          <Secao titulo="Mais vendidos" texto={`De ${dataBr(r.periodo.inicio)} a ${dataBr(r.periodo.fim)}.`}>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Produto</TableCell><TableCell align="right">Quantidade</TableCell><TableCell align="right">Vendas</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {r.maisVendidos.map((p) => (
                  <TableRow key={p.nomeProduto}>
                    <TableCell>{p.nomeProduto}</TableCell>
                    <TableCell align="right" sx={numeroCelula}>{p.quantidade}</TableCell>
                    <TableCell align="right" sx={numeroCelula}>{reais(p.receitaCentavos)}</TableCell>
                  </TableRow>
                ))}
                {!r.maisVendidos.length && <TableRow><TableCell colSpan={3} sx={{ color: 'text.secondary' }}>Sem vendas no período.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Secao>
        </>
      )}
    </Stack>
  );
}
