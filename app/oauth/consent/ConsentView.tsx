// Etapa 3D: tela de consentimento (somente apresentacao). Todo texto dinamico (nome do app, hosts, e-mail mascarado) e renderizado como TEXTO
// pelo React (escape automatico); nao ha dangerouslySetInnerHTML com dados externos.
import { ESCOPOS, MENSAGENS, type CodigoErro, type ConsentDados } from '../../lib/oauthConsent'

export type Tela =
  | { tipo: 'carregando' }
  | { tipo: 'invalido' }
  | { tipo: 'erro'; codigo: CodigoErro; retentavel: boolean }
  | { tipo: 'pronto'; dados: ConsentDados }
  | { tipo: 'enviando'; dados: ConsentDados; acao: 'aprovar' | 'negar' }
  | { tipo: 'concluido'; negou: boolean }

interface Props {
  tela: Tela
  onAutorizar: () => void
  onCancelar: () => void
  onTentarNovamente: () => void
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow-x: hidden; width: 100%; max-width: 100%; }
  .cs-pg { min-height: 100vh; background: radial-gradient(circle at 20% 20%, rgba(236,72,153,0.16), transparent 38%), radial-gradient(circle at 80% 10%, rgba(217,70,239,0.14), transparent 32%), radial-gradient(circle at 60% 80%, rgba(139,92,246,0.10), transparent 30%), linear-gradient(135deg, #08060A 0%, #120A14 50%, #08060A 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; align-items: center; justify-content: center; padding: 32px 16px; }
  .cs-wrap { width: 100%; max-width: 500px; display: flex; flex-direction: column; align-items: center; }
  .cs-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
  .cs-logo-txt { font-size: 18px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; }
  .cs-card { width: 100%; background: radial-gradient(circle at top left, rgba(139,92,246,0.10), transparent 40%), linear-gradient(145deg, rgba(24,16,27,0.97), rgba(18,10,20,0.99)); border: 1.5px solid #2A1A2F; border-radius: 22px; padding: 30px 26px; box-shadow: 0 24px 60px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.04); }
  .cs-h1 { font-size: 21px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 8px; overflow-wrap: anywhere; }
  .cs-p { font-size: 14px; color: #B8AAB8; line-height: 1.6; }
  .cs-conta { font-size: 13px; color: #B8AAB8; margin-bottom: 20px; }
  .cs-conta strong { color: #F8F4F7; font-weight: 700; }
  .cs-lbl { font-size: 11px; font-weight: 700; color: #B8AAB8; text-transform: uppercase; letter-spacing: .08em; margin: 18px 0 8px; }
  .cs-perm { display: flex; gap: 12px; padding: 12px 14px; border: 1px solid #2A1A2F; border-radius: 14px; background: rgba(24,16,27,.7); margin-bottom: 8px; }
  .cs-perm-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #EC4899, #8B5CF6); margin-top: 6px; flex-shrink: 0; }
  .cs-perm-t { font-size: 14px; font-weight: 700; color: #F8F4F7; margin-bottom: 2px; }
  .cs-perm-d { font-size: 13px; color: #B8AAB8; line-height: 1.5; }
  .cs-info { font-size: 13px; color: #B8AAB8; line-height: 1.6; margin-top: 14px; }
  .cs-info strong { color: #F8F4F7; }
  .cs-aviso { margin-top: 16px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(251,191,36,.35); background: rgba(251,191,36,.07); font-size: 13px; color: #FCD34D; line-height: 1.5; }
  .cs-dest { margin-top: 14px; font-size: 12px; color: #B8AAB8; line-height: 1.6; overflow-wrap: anywhere; }
  .cs-dest strong { color: #F8F4F7; }
  .cs-btns { display: flex; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
  .cs-btn { flex: 1 1 160px; border: none; border-radius: 12px; padding: 13px 18px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .cs-btn:disabled { opacity: .6; cursor: not-allowed; }
  .cs-ok { background: linear-gradient(135deg, #EC4899, #D946EF, #8B5CF6); color: #fff; box-shadow: 0 6px 24px rgba(236,72,153,.28); }
  .cs-no { background: rgba(24,16,27,.9); color: #F8F4F7; border: 1px solid #2A1A2F; }
  .cs-link { display: inline-block; margin-top: 18px; font-size: 13px; color: #C4B5FD; text-decoration: none; font-weight: 600; }
`

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="cs-pg">
      <style>{css}</style>
      <div className="cs-wrap">
        <div className="cs-logo">
          <img src="/minipage-pro-icon.png" alt="MiniPage Pro" width={36} height={36} style={{ borderRadius: '10px', objectFit: 'contain', flexShrink: 0 }} />
          <span className="cs-logo-txt">MiniPage Pro</span>
        </div>
        <div className="cs-card">{children}</div>
      </div>
    </div>
  )
}

export default function ConsentView({ tela, onAutorizar, onCancelar, onTentarNovamente }: Props) {
  if (tela.tipo === 'carregando') {
    return (
      <Moldura>
        <p className="cs-p" role="status">Verificando o pedido de acesso...</p>
      </Moldura>
    )
  }
  if (tela.tipo === 'invalido') {
    return (
      <Moldura>
        <h1 className="cs-h1">Link inválido</h1>
        <p className="cs-p" role="alert">Este link de autorização não é válido. Volte ao aplicativo e tente conectar novamente.</p>
        <a className="cs-link" href="/painel">Ir para o painel</a>
      </Moldura>
    )
  }
  if (tela.tipo === 'erro') {
    const m = MENSAGENS[tela.codigo]
    return (
      <Moldura>
        <h1 className="cs-h1">{m.titulo}</h1>
        <p className="cs-p" role="alert">{m.texto}</p>
        {tela.retentavel && (
          <div className="cs-btns">
            <button type="button" className="cs-btn cs-ok" onClick={onTentarNovamente}>Tentar novamente</button>
          </div>
        )}
        <a className="cs-link" href="/painel">Ir para o painel</a>
      </Moldura>
    )
  }
  if (tela.tipo === 'concluido') {
    return (
      <Moldura>
        <h1 className="cs-h1">{tela.negou ? 'Acesso cancelado' : 'Acesso autorizado'}</h1>
        <p className="cs-p" role="status">{tela.negou ? 'Nenhum dado foi compartilhado. Voltando ao aplicativo...' : 'Voltando ao aplicativo...'}</p>
      </Moldura>
    )
  }
  const { dados } = tela
  const enviando = tela.tipo === 'enviando'
  return (
    <Moldura>
      <h1 className="cs-h1">{dados.clienteNome} quer acessar a sua MiniPage</h1>
      {dados.conta && (
        <p className="cs-conta">Você está conectado como <strong>{dados.conta}</strong></p>
      )}
      <p className="cs-lbl">Este aplicativo poderá</p>
      {dados.escopos.map((e) => (
        <div className="cs-perm" key={e}>
          <span className="cs-perm-dot" aria-hidden="true" />
          <div>
            <p className="cs-perm-t">{ESCOPOS[e].titulo}</p>
            <p className="cs-perm-d">{ESCOPOS[e].texto}</p>
          </div>
        </div>
      ))}
      <p className="cs-info">
        <strong>Somente leitura.</strong> O aplicativo não consegue alterar nada na sua conta e não recebe dados pessoais dos seus clientes ou compradores.
        Você pode revogar este acesso quando quiser, em <strong>Painel &gt; Integrações com IA</strong>.
      </p>
      <p className="cs-aviso">Só autorize se foi você quem acabou de pedir esta conexão no aplicativo acima. Se não reconhece este pedido, clique em Cancelar.</p>
      <p className="cs-dest">
        Ao continuar, você voltará para <strong>{dados.redirectHost}</strong>
        {dados.clienteHost ? <> · endereço do aplicativo: <strong>{dados.clienteHost}</strong></> : null}
      </p>
      <div className="cs-btns">
        <button type="button" className="cs-btn cs-ok" onClick={onAutorizar} disabled={enviando}>
          {enviando && tela.acao === 'aprovar' ? 'Autorizando...' : 'Autorizar'}
        </button>
        <button type="button" className="cs-btn cs-no" onClick={onCancelar} disabled={enviando}>
          {enviando && tela.acao === 'negar' ? 'Cancelando...' : 'Cancelar'}
        </button>
      </div>
    </Moldura>
  )
}
