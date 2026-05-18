"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Perfil() {
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [perfilExiste, setPerfilExiste] = useState(false);

  useEffect(() => { carregarPerfil(); }, []);

  async function carregarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data } = await supabase.from("perfis").select("*").eq("user_id", user.id).single();
    if (data) {
      setNomeNegocio(data.nome_negocio);
      setDescricao(data.descricao || "");
      setSlug(data.slug);
      setWhatsapp(data.whatsapp || "");
      setEndereco(data.endereco || "");
      setPerfilExiste(true);
    }
  }

  function gerarSlug(nome: string) {
    return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
  }

  async function handleSalvar() {
    if (!nomeNegocio || !slug) { setMensagem("Nome e link são obrigatórios."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (perfilExiste) {
      const { error } = await supabase.from("perfis").update({ nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco }).eq("user_id", user?.id);
      setMensagem(error ? "Erro ao salvar." : "Perfil atualizado!");
    } else {
      const { error } = await supabase.from("perfis").insert({ user_id: user?.id, nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco });
      if (error) { setMensagem(error.message.includes("slug") ? "Esse link já está em uso." : "Erro ao salvar."); }
      else { setMensagem("Perfil criado!"); setPerfilExiste(true); }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <a href="/painel" className="text-xl font-bold">ClienteMarcado</a>
        <a href="/painel" className="text-zinc-400 hover:text-white text-sm transition">← Voltar ao painel</a>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Perfil do negócio</h2>
        <p className="text-zinc-400 mb-8">Configure como seu negócio aparece para os clientes</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome do negócio</label>
              <input type="text" placeholder="Ex: Barbearia do João" value={nomeNegocio} onChange={(e) => { setNomeNegocio(e.target.value); if (!perfilExiste) setSlug(gerarSlug(e.target.value)); }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Link personalizado</label>
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
                <span className="text-zinc-500 text-sm mr-1">clientemarcado.com.br/</span>
                <input type="text" placeholder="barbearia-do-joao" value={slug} onChange={(e) => setSlug(gerarSlug(e.target.value))} className="bg-transparent text-white placeholder-zinc-500 focus:outline-none flex-1 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Descrição (opcional)</label>
              <textarea placeholder="Ex: Barbearia especializada em cortes modernos." value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">WhatsApp (opcional)</label>
              <input type="text" placeholder="Ex: 11999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Endereço (opcional)</label>
              <input type="text" placeholder="Ex: Rua das Flores, 123 - São Paulo" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            {mensagem && <p className="text-sm text-orange-400">{mensagem}</p>}
            <button onClick={handleSalvar} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">{loading ? "Salvando..." : "Salvar perfil"}</button>
            {perfilExiste && <a href={`/${slug}`} target="_blank" className="w-full text-center border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white py-3 rounded-lg font-semibold transition">Ver minha página pública →</a>}
          </div>
        </div>
      </div>
    </main>
  );
}
