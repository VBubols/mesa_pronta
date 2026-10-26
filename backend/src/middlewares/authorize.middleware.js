import { AppError } from '../utils/AppError.js';

export function autorizar(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.role)) {
            throw new AppError(403, 'Acesso negado');
        }
        next();
    };
}