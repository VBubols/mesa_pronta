export function semUndefined(objeto) {
    return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined));
}