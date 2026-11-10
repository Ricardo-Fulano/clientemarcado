// Duplo do modulo auth-bearer-servidor para os testes da ROTA.
export const estado = { usuario: { id: 'usuario-de-teste' }, cabecalhosRecebidos: [] }
export async function usuarioDoBearer(cabecalho) { estado.cabecalhosRecebidos.push(cabecalho); return /^Bearer\s+\S{20,}$/.test(String(cabecalho || '')) ? estado.usuario : null }
