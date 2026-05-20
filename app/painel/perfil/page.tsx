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
  const [copiado, setCopiado] = useState(false);

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
    if (!nomeNegocio || !slug) { setMensagem("Nome e link sao obrigatorios."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (perfilExiste) {
      const { error } = await supabase.from("perfis").update({ nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco }).eq("user_id", user?.id);
      setMensagem(error ? "Erro ao salvar." : "Perfil atualizado!");
    } else {
      const { error } = await supabase.from("perfis").insert({ user_id: user?.id, nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco });
      if (error) { setMensagem(error.message.includes("slug") ? "Esse link ja esta em uso." : "Erro ao salvar."); }
      else { setMensagem("Perfil criado!"); setPerfilExiste(true); }
    }
    setLoading(false);
  }

  function copiarLink() {
    const link = "https://clientemarcado.vercel.app/" + slug;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function compartilharWhatsapp() {
    const link = "https://clientemarcado.vercel.app/" + slug;
    const texto = "Agende seu horario comigo pelo link: " + link;
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <a href="/painel" className="text-xl font-bold">ClienteMarcado</a>
        <a href="/painel" className="text-zinc-400 hover:text-white text-sm transition">voltar ao painel</a>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Perfil do negocio</h2>
        <p className="text-zinc-400 mb-8">Configure como seu negocio aparece para os clientes</p>

        {perfilExiste && (
          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-6 mb-6">
            <p className="text-orange-400 font-semibold mb-1">Seu link de agendamento</p>
            <p className="text-white text-sm mb-4">
              {"https://clientemarcado.vercel.app/" + slug}
            </p>
            <div className="flex gap-3">
              <button
                onClick={copiarLink}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition text-sm"
              >
                {copiado ? "Copiado!" : "Copiar link"}
              </button>
              <button
                onClick={compartilharWhatsapp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition text-sm"
              >
                Compartilhar no WhatsApp
              </button>
              
                <a href={"/" + slug}
                target="_blank"
                className="flex-1 text-center border border-zinc-600 hover:border-white text-zinc-400 hover:text-white py-2 rounded-lg font-semibold transition text-sm"
              >
                Ver pagina
              </a>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome do negocio</label>
              <input type="text" placeholder="Ex: Barbearia do Joao" value={nomeNegocio} onChange={(e) => { setNomeNegocio(e.target.value); if (!perfilExiste) setSlug(gerarSlug(e.target.value)); }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Link personalizado</label>
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
                <span className="text-zinc-500 text-sm mr-1">clientemarcado.vercel.app/</span>
                <input type="text" placeholder="barbearia-do-joao" value={slug} onChange={(e) => setSlug(gerarSlug(e.target.value))} className="bg-transparent text-white placeholder-zinc-500 focus:outline-none flex-1 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Descricao (opcional)</label>
              <textarea placeholder="Ex: Barbearia especializada em cortes modernos." value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">WhatsApp (opcional)</label>
              <input type="text" placeholder="Ex: 11999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Endereco (opcional)</label>
              <input type="text" placeholder="Ex: Rua das Flores, 123 - Sao Paulo" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
            </div>
            {mensagem && <p className="text-sm text-orange-400">{mensagem}</p>}
            <button onClick={handleSalvar} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">{loading ? "Salvando..." : "Salvar perfil"}</button>
          </div>
        </div>
      </div>
    </main>
  );
}