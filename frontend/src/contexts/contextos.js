import { createContext } from 'react';

// Os contextos ficam num arquivo separado dos providers para o Fast Refresh do Vite
// continuar funcionando (arquivo .jsx que exporta componente só deve exportar componentes).
export const AuthContext = createContext(null);
