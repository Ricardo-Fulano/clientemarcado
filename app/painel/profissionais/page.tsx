"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
}

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarProfissionais();
  }, []);

  async function carregarProfissionais() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data } = await supabase
      .from("profissionais")
      .select("*")
      .eq("user_id", user.id);

    if (data) setProfissionais(data);
  }

  async function handleAdicionar() {
    if (!nome) {
      setMensagem("Preencha o nome do profissional.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("profissionais").insert({
      user_id: user?.id,
      nome,
      especialidade,
    });

    if (error) {
      setMensagem("Erro ao salvar profissional.");
    } else {
      setNome("");
      setEspecialidade("");
      setMensagem("Profissional adicionado!");
      carregarProfissionais();
    }

    setLoading(false);
  }

  async function handleExcluir(id: string) {
    await supabase.from("profissionais").delete().eq("id", id);
    carregarProfissionais();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <a href="/painel" className="text-xl font-bold">ClienteMarcado</a>
        <a href="/painel" className="text-zinc-400 hover:text-white text-sm transition">← Voltar ao painel</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Minha equipe</h2>
        <p className="text-zinc-400 mb-8">Cadastre os profissionais do seu negócio</p>

        {/* Formulário */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Adicionar profissional</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome</label>
              <input
                type="text"
                placeholder="Ex: Carlos Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Especialidade (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Corte masculino, barba"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {mensagem && (
              <p className="text-sm text-orange-400">{mensagem}</p>
            )}

            <button
              onClick={handleAdicionar}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Adicionar profissional"}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {profissionais.length === 0 && (
            <p className="text-zinc-500 text-center py-8">Nenhum profissional cadastrado ainda.</p>
          )}
          {profissionais.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.nome}</p>
                {p.especialidade && (
                  <p className="text-zinc-400 text-sm">{p.especialidade}</p>
                )}
              </div>
              <button
                onClick={() => handleExcluir(p.id)}
                className="text-red-400 hover:text-red-300 text-sm transition"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}