export class AppError extends Error {
    constructor(status, mensagem, detalhes) {
        super(mensagem);
        this.status = status;
        this.detalhes = detalhes;
    }
}