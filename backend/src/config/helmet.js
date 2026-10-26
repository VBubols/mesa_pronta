import helmet from 'helmet';

export const helmetConfig = helmet({

  // impede incorporação em iframes de outros domínios
  frameguard: { action: 'deny' },

  // remove o cabeçalho X-Powered-By: Express
  hidePoweredBy: true,

  // impede MIME sniffing
  noSniff: true,

  // política de referrer
  referrerPolicy: { policy: 'no-referrer' },

  // Content-Security-Policy — para APIs REST, pode ser false
  // pois não servimos HTML. Para apps full-stack, configure.
  contentSecurityPolicy: false,
});