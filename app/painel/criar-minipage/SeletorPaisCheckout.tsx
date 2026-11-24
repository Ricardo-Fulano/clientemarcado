 'use client'
import {useMemo,useState} from 'react'
import { PAISES_OFERTA } from '../../lib/billing/stripe/catalogo-internacional-unico'
import { CORES_CHECKOUT as C } from '../../lib/billing/multigateway/checkout-visual'
function paisNome(pais:string,idioma:string){try{return new Intl.DisplayNames([idioma],{type:'region'}).of(pais)||pais}catch{return pais}}
function norm(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
export default function SeletorPaisCheckout({pais,onPais,idioma='pt-BR'}:{pais:string;onPais:(pais:string)=>void;idioma?:string}){
 const [busca,setBusca]=useState(''),[aberto,setAberto]=useState(false)
 const opcoes=useMemo(()=>PAISES_OFERTA.map(c=>({codigo:c,nome:paisNome(c,idioma),ingles:paisNome(c,'en-US')})).sort((a,b)=>a.nome.localeCompare(b.nome,idioma)),[idioma])
 const filtrados=useMemo(()=>{const q=norm(busca);return (q?opcoes.filter(p=>norm(p.nome).includes(q)||norm(p.ingles).includes(q)||p.codigo.toLowerCase().includes(q)):opcoes).slice(0,75)},[busca,opcoes])
 return <section style={{minWidth:0}}>
   <label htmlFor="mp-pais-input" style={{display:'block',fontSize:13,fontWeight:750,marginBottom:7,color:C.texto}}>País de cobrança</label>
   <button type="button" aria-expanded={aberto} onClick={()=>{setAberto(v=>!v);setBusca('')}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',borderRadius:10,background:C.cardElevado,border:'1px solid '+C.borda,color:C.texto,textAlign:'left',cursor:'pointer'}}>
     <span>{paisNome(pais,idioma)} ({pais})</span><span aria-hidden="true">⌄</span>
   </button>
   {aberto&&<div style={{padding:10,border:'1px solid '+C.borda,borderRadius:10,marginTop:6,background:C.cardElevado}}>
     <input autoFocus id="mp-pais-input" type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar país pelo nome ou código" style={{width:'100%',boxSizing:'border-box',background:C.fundo,color:C.texto,border:'1px solid '+C.borda,borderRadius:9,padding:'12px 13px',outlineColor:C.verde}}/>
     <div role="listbox" aria-label="Países de cobrança" style={{maxHeight:210,overflowY:'auto',marginTop:6,display:'grid',gap:2}}>
       {filtrados.map(p=><button type="button" role="option" aria-selected={p.codigo===pais} key={p.codigo} onClick={()=>{onPais(p.codigo);setAberto(false);setBusca('')}} style={{padding:'8px 10px',border:0,borderRadius:7,background:p.codigo===pais?C.verdeEscuro:'transparent',color:p.codigo===pais?C.verde:C.texto,textAlign:'left',cursor:'pointer'}}>{p.nome} <span style={{color:C.mutado,fontSize:11}}>({p.codigo})</span></button>)}
       {!filtrados.length&&<p style={{color:C.mutado,fontSize:12,padding:10}}>Nenhum país encontrado.</p>}
       {filtrados.length===75&&<p style={{color:C.mutado,fontSize:11,margin:'5px 9px'}}>Digite um nome para filtrar mais resultados.</p>}
     </div>
   </div>}
   <div style={{display:'flex',justifyContent:'space-between',gap:12,color:C.mutado,fontSize:11,marginTop:8,flexWrap:'wrap'}}><span>Oferta: {pais==='BR'?'Brasil':'Internacional'}</span><span>Moeda: {pais==='BR'?'BRL':'USD'}</span></div>
 </section>
}
