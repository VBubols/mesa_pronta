import crypto from 'node:crypto';

function chave(nome) {
    const valor = process.env[nome];
    if (!valor || !/^[0-9a-f]{64}$/i.test(valor)) {
        throw new Error(`${nome} deve ser uma chave hexadecimal de 64 caracteres (32 bytes)`);
    }
    return Buffer.from(valor, 'hex');
}

// Chamada na subida do servidor para falhar cedo se as chaves estiverem erradas
export function validarChaves() {
    chave('CPF_CHAVE_CRIPTO');
    chave('CPF_CHAVE_HASH');
}

export function cifrar(texto) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', chave('CPF_CHAVE_CRIPTO'), iv);
    const dados = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, dados].map((b) => b.toString('base64')).join('.');
}

export function decifrar(payload) {
    const [iv, tag, dados] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', chave('CPF_CHAVE_CRIPTO'), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(dados), decipher.final()]).toString('utf8');
}

// Determinístico: mesmo CPF gera sempre o mesmo hash (usado para unicidade e busca)
export function hashDeterministico(texto) {
    return crypto.createHmac('sha256', chave('CPF_CHAVE_HASH')).update(texto).digest('hex');
}