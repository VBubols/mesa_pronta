import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './contextos.js';
import * as authApi from '../api/auth.js';
import { apagarToken, definirAoExpirarSessao, lerToken, salvarToken } from '../api/client.js';

const CHAVE_USUARIO = 'portal-vagas:usuario';

// Guarda só o que a interface usa. Nunca CPF, telefone ou dados sensíveis.
function resumirUsuario(usuario) {
  const { id, nome, sobrenome, email, role } = usuario;
  return { id, nome, sobrenome, email, role };
}

function lerUsuarioSalvo() {
  if (!lerToken()) return null;
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

function salvarUsuario(usuario) {
  try {
    if (usuario) localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    else localStorage.removeItem(CHAVE_USUARIO);
  } catch {
    // sem armazenamento, a sessão dura até recarregar a página
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(lerUsuarioSalvo);

  const sair = useCallback(() => {
    apagarToken();
    salvarUsuario(null);
    setUsuario(null);
  }, []);

  // Token expirado em qualquer chamada da API -> desloga.
  useEffect(() => {
    definirAoExpirarSessao(sair);
    return () => definirAoExpirarSessao(null);
  }, [sair]);

  // Ao abrir o app com sessão salva, confirma o token no backend.
  // Se ele expirou, o 401 dispara o sair() acima.
  useEffect(() => {
    if (!lerToken()) return;
    authApi
      .obterPerfil()
      .then((perfil) => {
        const atual = resumirUsuario(perfil);
        salvarUsuario(atual);
        setUsuario(atual);
      })
      .catch(() => {});
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const resposta = await authApi.login(email, senha);
    const atual = resumirUsuario(resposta.usuario);
    salvarToken(resposta.token);
    salvarUsuario(atual);
    setUsuario(atual);
    return atual;
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      logado: Boolean(usuario),
      ehAdmin: usuario?.role === 'admin',
      entrar,
      sair,
    }),
    [usuario, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
