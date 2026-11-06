// Infraestrutura de teste: banco falso em memoria (imita o subconjunto do PostgREST usado), Resend falso com idempotencia real.
import { createHash } from 'node:crypto'

const tick = () => new Promise((r) => setImmediate(r))

/** Banco falso: tabela convites_transferencia. Cada operacao cede o controle (permite interleaving de requisicoes simultaneas). */
/** relogio unico compartilhado entre o banco falso (criado_em) e as dependencias (agora): mesma linha do tempo */
export function criarRelogio() {
  const r = { ms: Date.UTC(2026, 10, 6, 14, 0, 0), avancar(s) { r.ms += s * 1000 } }
  return r
}

export function criarBancoFake(linhasIniciais = [], relogio = criarRelogio()) {
  const estado = { rows: linhasIniciais.map((r) => ({ ...r })), seq: linhasIniciais.filter((r) => String(r.id).startsWith('conv-')).length, falhas: {}, operacoes: [] }
  const proximoInstante = () => { const iso = new Date(relogio.ms).toISOString(); relogio.ms += 1000; return iso }

  class Consulta {
    constructor() { this.op = null; this.payload = null; this.filtros = []; this.querRetorno = false; this.lim = null; this.unico = null }
    insert(p) { this.op = 'insert'; this.payload = p; return this }
    update(p) { this.op = 'update'; this.payload = p; return this }
    select() { if (!this.op) this.op = 'select'; else this.querRetorno = true; return this }
    eq(c, v) { this.filtros.push((r) => r[c] === v); return this }
    neq(c, v) { this.filtros.push((r) => r[c] !== v); return this }
    lt(c, v) { this.filtros.push((r) => r[c] < v); return this }
    gte(c, v) { this.filtros.push((r) => r[c] >= v); return this }
    is(c, v) { this.filtros.push((r) => (v === null ? r[c] == null : r[c] === v)); return this }
    order(col, opts = {}) { this.ordem = { col, asc: opts.ascending !== false }; return this }
    limit(n) { this.lim = n; return this }
    single() { this.unico = 'single'; return this }
    maybeSingle() { this.unico = 'maybe'; return this }
    then(resolve, reject) { return this.executar().then(resolve, reject) }
    async executar() {
      await tick()
      const falha = estado.falhas[this.op]
      if (falha && falha.restantes > 0) { falha.restantes--; return { data: null, error: { message: `falha simulada em ${this.op}` } } }
      estado.operacoes.push({ op: this.op, payload: this.payload })
      if (this.op === 'insert') {
        const linha = { id: `conv-${++estado.seq}`, criado_em: proximoInstante(), aceito_em: null, resend_email_id: null, email_status: null, email_erro: null, ...this.payload }
        estado.rows.push(linha)
        return { data: this.unico ? { id: linha.id, criado_em: linha.criado_em } : [{ id: linha.id }], error: null }
      }
      let alvo = estado.rows.filter((r) => this.filtros.every((f) => f(r)))
      if (this.op === 'update') {
        for (const r of alvo) Object.assign(r, this.payload)
        return { data: this.querRetorno ? alvo.map((r) => ({ id: r.id })) : null, error: null }
      }
      if (this.ordem) alvo = [...alvo].sort((a, b) => (a[this.ordem.col] < b[this.ordem.col] ? -1 : a[this.ordem.col] > b[this.ordem.col] ? 1 : 0) * (this.ordem.asc ? 1 : -1))
      if (this.lim) alvo = alvo.slice(0, this.lim)
      if (this.unico === 'maybe') return { data: alvo[0] ?? null, error: null }
      return { data: alvo, error: null }
    }
  }
  return {
    estado,
    from(tabela) { if (tabela !== 'convites_transferencia') throw new Error('tabela inesperada: ' + tabela); return new Consulta() },
    falharProxima(op, vezes = 1) { estado.falhas[op] = { restantes: vezes } },
    linha: (id) => estado.rows.find((r) => r.id === id),
    pendentes: (perfil) => estado.rows.filter((r) => r.perfil_id === perfil && r.status === 'pendente'),
  }
}

/** Resend falso: roteiro de resultados por CHAMADA; idempotencia real (mesma chave + mesmo corpo => mesmo id, sem novo e-mail). */
export function criarEmailFake(roteiro = []) {
  const chamadas = []
  const porChave = new Map()
  let n = 0
  return {
    chamadas,
    emailsRealmenteEnviados: () => porChave.size,
    async enviar(msg, chave) {
      await tick()
      chamadas.push({ para: msg.para, assunto: msg.assunto, html: msg.html, chave })
      const passo = roteiro[chamadas.length - 1] ?? { tipo: 'aceito' }
      if (passo.tipo === 'aceito') {
        if (porChave.has(chave)) return { tipo: 'aceito', id: porChave.get(chave) } // deduplicado pelo Resend
        const id = passo.id ?? `em_${++n}`
        porChave.set(chave, id)
        return { tipo: 'aceito', id }
      }
      if (passo.tipo === 'incerto-mas-enviou') { // o e-mail SAIU, mas a resposta se perdeu (cenario mais perigoso)
        if (!porChave.has(chave)) porChave.set(chave, `em_${++n}`)
        return { tipo: 'incerto', motivo: 'timeout' }
      }
      if (passo.tipo === 'lanca') throw new Error('boom')
      return passo
    },
  }
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex')

export function criarDeps(over = {}) {
  const relogio = over.relogio ?? criarRelogio()
  const logs = []
  return {
    logs,
    relogio,
    agora: () => new Date(relogio.ms),
    gerarToken: (() => { let i = 0; return () => { const tokenCru = `token-secreto-${++i}`; return { tokenCru, tokenHash: sha256(tokenCru) } } })(),
    esperar: async () => {},
    log: (e, d) => logs.push({ e, d }),
    ...Object.fromEntries(Object.entries(over).filter(([k]) => k !== 'relogio')),
  }
}

export const ADMIN = { adminId: 'user-dono', adminEmail: 'dono@exemplo.com', perfil: { id: 'perfil-1', nome_negocio: 'Studio Ana' }, siteUrl: 'https://site.exemplo' }
export const entrada = (over = {}) => ({ ...ADMIN, emailNovo: 'ana@exemplo.com', ...over })

/** estado de producao simulado: um convite real pendente (Ana) + outro perfil + historico */
export function semearProducao() {
  return [
    { id: 'ana-1', perfil_id: 'perfil-1', user_id_atual: 'user-dono', email_novo: 'anapirelli1988@gmail.com', token_hash: sha256('token-da-ana'), status: 'pendente', criado_em: '2026-11-06T12:45:13.363Z', expira_em: '2026-11-13T12:45:13.316Z', aceito_em: null, resend_email_id: null, email_status: null, email_erro: null },
    { id: 'outro-1', perfil_id: 'perfil-2', user_id_atual: 'user-outro', email_novo: 'outro@exemplo.com', token_hash: sha256('token-outro'), status: 'pendente', criado_em: '2026-11-05T10:00:00.000Z', expira_em: '2026-11-12T10:00:00.000Z', aceito_em: null, resend_email_id: null, email_status: null, email_erro: null },
    { id: 'hist-1', perfil_id: 'perfil-1', user_id_atual: 'user-dono', email_novo: 'x@exemplo.com', token_hash: sha256('hist'), status: 'aceito', criado_em: '2026-10-01T10:00:00.000Z', expira_em: '2026-10-08T10:00:00.000Z', aceito_em: '2026-10-02T10:00:00.000Z', resend_email_id: null, email_status: null, email_erro: null },
  ]
}
