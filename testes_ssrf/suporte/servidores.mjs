// Servidores HTTP/HTTPS locais (loopback) para os testes de rede. Nenhuma requisicao sai da maquina.
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
export async function iniciar(manipulador, tls) {
  const servidor = tls ? https.createServer({ key: tls.key, cert: tls.cert }, manipulador) : http.createServer(manipulador)
  const sockets = new Set(); servidor.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)) })
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok))
  const info = { porta: servidor.address().port, conexoes: 0, requisicoes: 0, servidor, fechar: () => new Promise((ok) => { for (const s of sockets) s.destroy(); servidor.close(() => ok()) }) }
  servidor.on('connection', () => { info.conexoes++ })
  servidor.on('request', () => { info.requisicoes++ })
  return info
}
export async function ipv6Disponivel() { return new Promise((ok) => { const s = net.createServer(); s.on('error', () => ok(false)); s.listen(0, '::1', () => s.close(() => ok(true))) }) }
export const espera = (ms) => new Promise((ok) => setTimeout(ok, ms))
