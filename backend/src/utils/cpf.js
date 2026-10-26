export function somenteDigitos(valor) {
    return String(valor ?? '').replace(/\D/g, '');
}

export function cpfValido(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

    const digito = (base) => {
        const soma = [...base].reduce((acc, d, i) => acc + Number(d) * (base.length + 1 - i), 0);
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
}

export function mascararCpf(cpf) {
    return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}