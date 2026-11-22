'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SeletorIdiomaGlobal from '../components/SeletorIdiomaGlobal'
import { useIdiomaGlobal } from '../components/IdiomaProviderGlobal'
import { normalizarTelefoneCadastro } from '../lib/telefone-cadastro-global'

const TXT = {
 'pt-BR': ['Contato privado (opcional)','Este número serve para atendimento e contato sobre a conta. Não será exibido na sua MiniPage.','Telefone com código do país','Ex.: +55 11 99999 9999, +595 981 123456','Quero receber novidades, modelos e ofertas da MiniPage Pro por e-mail e/ou WhatsApp.','Salvar e continuar','Pular por enquanto','Digite um número válido com + e código do país.','Não foi possível salvar. Tente novamente ou pule esta etapa.'],
 'en-US': ['Private contact (optional)','This number is for account support. It will not appear on your public MiniPage.','Phone with country code','E.g. +1 415 555 0123, +595 981 123456','I want to receive MiniPage Pro updates, templates and offers by email and/or WhatsApp.','Save and continue','Skip for now','Enter a valid number beginning with + and country code.','Could not save. Try again or skip.'],
 'es-ES': ['Contacto privado (opcional)','Este número se usa para asistencia. No aparecerá en tu MiniPage pública.','Teléfono con código de país','Ej.: +34 612 345 678, +595 981 123456','Quiero recibir noticias, modelos y ofertas por email y/o WhatsApp.','Guardar y continuar','Omitir por ahora','Introduce un número válido que comience por + y código de país.','No se pudo guardar. Inténtalo o omite.'],
 'fr-FR': ['Contact privé (facultatif)','Ce numéro sert à l’assistance. Il ne sera pas affiché sur votre MiniPage publique.','Téléphone avec indicatif','Ex. : +33 6 12 34 56 78','Je souhaite recevoir des actualités, modèles et offres par e-mail et/ou WhatsApp.','Enregistrer et continuer','Ignorer pour le moment','Saisissez un numéro valide commençant par + et l’indicatif.','Enregistrement impossible. Réessayez ou ignorez.'],
 'de-DE': ['Privater Kontakt (optional)','Diese Nummer dient dem Support und wird nicht öffentlich auf deiner MiniPage angezeigt.','Telefonnummer mit Landesvorwahl','Z. B. +49 151 23456789','Ich möchte Neuigkeiten, Vorlagen und Angebote per E-Mail und/oder WhatsApp erhalten.','Speichern und weiter','Jetzt überspringen','Gib eine gültige Nummer mit + und Landesvorwahl ein.','Speichern fehlgeschlagen. Bitte erneut versuchen oder überspringen.'],
 'it-IT': ['Contatto privato (facoltativo)','Questo numero serve per assistenza e non sarà mostrato sulla MiniPage pubblica.','Telefono con prefisso internazionale','Es.: +39 312 345 6789','Desidero ricevere novità, modelli e offerte via e-mail e/o WhatsApp.','Salva e continua','Salta per ora','Inserisci un numero valido con + e prefisso internazionale.','Salvataggio non riuscito. Riprova o salta.']
} as const
export default function ContatoInicial() {
 const { idioma } = useIdiomaGlobal()
 const t: readonly string[] = TXT[idioma] || TXT['pt-BR']
 const [telefone,setTelefone] = useState('')
 const [marketing,setMarketing] = useState(false)
 const [ocupado,setOcupado] = useState(false)
 const [erro,setErro] = useState('')
 const [autenticado,setAutenticado] = useState(false)
 useEffect(() => { supabase.auth.getUser().then(({data})=> { if (!data.user) window.location.replace('/login'); else setAutenticado(true) }) },[])
 async function salvar() {
  if (ocupado) return
  const tel = telefone.trim() ? normalizarTelefoneCadastro(telefone) : null
  if (telefone.trim() && (!telefone.trim().startsWith('+') || !tel)) { setErro(t[7]);return }
  setOcupado(true);setErro('')
  try {
   const {data:{user}} = await supabase.auth.getUser()
   if(!user) {window.location.replace('/login');return}
   // User metadata: privado no sistema de autenticacao, nunca copiado ao perfil publico.
   const {error} = await supabase.auth.updateUser({data:{
     telefone_privado: tel,
     contato_inicial_concluido: true,
     marketing_consentimento: marketing,
     marketing_consentimento_em: marketing ? new Date().toISOString() : null,
     marketing_consentimento_canais: marketing ? ['email','whatsapp'] : [],
   }})
   if(error) {setErro(t[8]);setOcupado(false);return}
   window.location.assign('/painel/criar-minipage')
  } catch {setErro(t[8]);setOcupado(false)}
 }
 return <main style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#21172E,#0C0A12 60%)',color:'#F6F3FA',padding:'24px 16px',fontFamily:'Arial,sans-serif'}}>
  <div style={{display:'flex',justifyContent:'flex-end',maxWidth:480,margin:'0 auto 30px'}}><SeletorIdiomaGlobal /></div>
  <section style={{maxWidth:440,margin:'auto',border:'1px solid #43344D',background:'#1A1424',padding:24,borderRadius:22}}>
    <div style={{color:'#C9FA45',fontWeight:800,marginBottom:20}}>MiniPage Pro</div>
    <h1 style={{fontSize:25,margin:'0 0 12px'}}>{t[0]}</h1>
    <p style={{color:'#BEB5CD',lineHeight:1.6,marginBottom:25}}>{t[1]}</p>
    <label htmlFor="contato-privado" style={{display:'block',fontSize:13,marginBottom:8}}>{t[2]}</label>
    <input id="contato-privado" type="tel" autoComplete="tel" inputMode="tel" value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="+55 11 99999 9999" style={{width:'100%',padding:14,fontSize:16,borderRadius:12,border:'1px solid #564563',background:'#0F0B16',color:'#fff',boxSizing:'border-box'}}/>
    <p style={{color:'#BEB5CD',fontSize:12,marginTop:8}}>{t[3]}</p>
    <label style={{display:'flex',gap:10,alignItems:'flex-start',margin:'24px 0',fontSize:13,lineHeight:1.5}}><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} style={{accentColor:'#C9FA45',marginTop:3}}/><span>{t[4]}</span></label>
    {erro && <p role="alert" style={{color:'#FFAAAA'}}>{erro}</p>}
    <button type="button" onClick={salvar} disabled={!autenticado||ocupado} style={{background:'#C9FA45',border:0,borderRadius:12,padding:14,width:'100%',fontWeight:800,cursor:'pointer',color:'#10140A',fontSize:15}}>{t[5]}</button>
    <button type="button" onClick={()=>window.location.assign('/painel/criar-minipage')} style={{background:'transparent',border:0,color:'#D4CADF',padding:14,width:'100%',cursor:'pointer',marginTop:10}}>{t[6]}</button>
  </section>
 </main>
}
