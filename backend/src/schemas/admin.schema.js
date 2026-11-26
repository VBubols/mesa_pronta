import { z } from 'zod';
import { ROLES } from '../constants/roles.js';
import {
    emailSchema, senhaSchema, nomeSchema, sobrenomeSchema, celularSchema, opcional,
} from './common.schema.js';

// O admin cria funcionários (e outros admins). Clientes se cadastram sozinhos em /auth/cadastro.
export const criarUsuarioSchema = z.object({
    nome: nomeSchema,
    sobrenome: sobrenomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    telefoneCelular: opcional(celularSchema),
    role: z.enum(['funcionario', 'admin'], { error: 'Perfil deve ser funcionario ou admin' }),
});

export const listarUsuariosQuerySchema = z.object({
    busca: z.string().trim().max(100).optional(),
    role: z.enum(ROLES, { error: `Perfil deve ser um de: ${ROLES.join(', ')}` }).optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
});
