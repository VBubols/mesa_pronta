// Vite (frontend dev) roda em 5173; mantemos 3000 pra ferramentas locais.
// Em produção, CORS_ORIGINS lista o endereço do front, separado por vírgula se
// houver mais de um. Ex.: CORS_ORIGINS=https://mesa-pronta.vercel.app
const origensPermitidas = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origem) => origem.trim().replace(/\/+$/, ''))
    .filter(Boolean),
];

export const corsConfig = {
  origin(origin, callback) {
    // Permite requisições sem origin (Postman, curl) e as origens da lista
    if (!origin || origensPermitidas.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
