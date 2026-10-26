import test from 'node:test';
import assert from 'node:assert/strict';
import { validarQuery, validarParams } from '../src/middlewares/validator-query.middleware.js';
import { validar } from '../src/middlewares/validator.middleware.js';
import { tratadorDeErros } from '../src/middlewares/error.middleware.js';
import { AppError } from '../src/utils/AppError.js';
import { corsConfig } from '../src/config/cors.js';

// Schema falso: dispensa o Zod e o banco, e deixa o teste focado no middleware.
const schemaFalso = {
  safeParse(entrada) {
    if (entrada?.ok) return { success: true, data: { ok: true, extra: 1 } };
    return {
      success: false,
      error: { issues: [{ path: ['limite'], message: 'Muito alto' }, { path: [], message: 'Inválido' }] },
    };
  },
};

const respostaFalsa = () => ({
  statusCode: null,
  corpo: null,
  status(codigo) { this.statusCode = codigo; return this; },
  json(corpo) { this.corpo = corpo; return this; },
});

const capturarErro = (fn) => {
  try { fn(); } catch (erro) { return erro; }
  return assert.fail('era para lançar um erro');
};

test('query inválida lança AppError 400 com detalhes', () => {
  const erro = capturarErro(() => validarQuery(schemaFalso)({ query: {} }, {}, () => {}));
  assert.ok(erro instanceof AppError);
  assert.equal(erro.status, 400);
  assert.equal(erro.message, 'Parâmetros inválidos');
  assert.deepEqual(erro.detalhes, [
    { campo: 'limite', mensagem: 'Muito alto' },
    { campo: '', mensagem: 'Inválido' },
  ]);
});

test('query válida chama next e guarda o resultado em req.validado, sem mexer em req.query', () => {
  const req = { query: { ok: true } };
  let chamadas = 0;
  validarQuery(schemaFalso)(req, {}, () => { chamadas += 1; });
  assert.equal(chamadas, 1);
  assert.deepEqual(req.validado.query, { ok: true, extra: 1 });
  assert.deepEqual(req.query, { ok: true });
});

test('validarParams preserva o que validarQuery já guardou', () => {
  const req = { query: { ok: true }, params: { ok: true } };
  validarQuery(schemaFalso)(req, {}, () => {});
  validarParams(schemaFalso)(req, {}, () => {});
  assert.deepEqual(Object.keys(req.validado).sort(), ['params', 'query']);
});

test('erro de query e erro de body saem no mesmo formato: { mensagem, detalhes }', () => {
  const daQuery = capturarErro(() => validarQuery(schemaFalso)({ query: {} }, {}, () => {}));
  const doBody = capturarErro(() => validar(schemaFalso)({ body: {} }, {}, () => {}));

  const respostaQuery = respostaFalsa();
  const respostaBody = respostaFalsa();
  tratadorDeErros(daQuery, {}, respostaQuery, () => {});
  tratadorDeErros(doBody, {}, respostaBody, () => {});

  assert.equal(respostaQuery.statusCode, 400);
  assert.equal(respostaBody.statusCode, 400);
  assert.deepEqual(Object.keys(respostaQuery.corpo).sort(), ['detalhes', 'mensagem']);
  assert.deepEqual(Object.keys(respostaBody.corpo).sort(), ['detalhes', 'mensagem']);
  assert.deepEqual(respostaQuery.corpo.detalhes, respostaBody.corpo.detalhes);
});

test('cors: expõe o Content-Disposition (nome do PDF) para o front', () => {
  assert.ok(corsConfig.exposedHeaders.includes('Content-Disposition'));
});

test('cors: aceita o Vite local e bloqueia outras origens', () => {
  let resultado;
  corsConfig.origin('http://localhost:5173', (erro, permitido) => { resultado = { erro, permitido }; });
  assert.deepEqual(resultado, { erro: null, permitido: true });

  corsConfig.origin('http://site-estranho.com', (erro) => { resultado = { erro }; });
  assert.equal(resultado.erro.message, 'Origem não permitida pelo CORS');
});
