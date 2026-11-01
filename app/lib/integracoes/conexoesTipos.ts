// Tipos compartilhados entre as rotas de conexoes (servidor) e a tela do painel (navegador). Sem imports de Node.
export type StatusConexao = 'test' | 'active' | 'paused' | 'revoked'
// Estado que a TELA mostra (derivado): a suspensao por plano nunca e gravada, e calculada na hora.
export type EstadoEfetivo = 'teste' | 'ativa' | 'pausada' | 'suspensa_plano' | 'sem_token'
export type AcaoConexao = 'pausar' | 'reativar' | 'ativar' | 'renomear' | 'encerrar_token_anterior'

export interface ConexaoVisao {
  id: string
  provider: string
  label: string | null
  status: Exclude<StatusConexao, 'revoked'>
  efetivo: EstadoEfetivo
  url: string
  usa_token: boolean
  config: Record<string, unknown>
  last_event_at: string | null
  dropped_count: number
  last_dropped_at: string | null
  created_at: string
  token: { existe: boolean; rotated_at: string | null; anterior_ate: string | null }
}
export interface RespostaLista { elegivel: boolean; conexoes: ConexaoVisao[]; provedores: string[] }
export interface RespostaConexao { conexao: ConexaoVisao }
export interface RespostaComToken { conexao: ConexaoVisao; token: string | null }
export interface RespostaErro { error: string; codigo: string }
