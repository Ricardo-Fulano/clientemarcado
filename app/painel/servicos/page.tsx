"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarServicos();
  }, []);

  async function carregarServicos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data } = await supabase
      .from("servicos")
      .select("*")
      .eq("user_id", user.id);

    if (data) setServicos(data);
  }

  async function handleAdicionarServico() {
    if (!nome || !preco || !duracao) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("servicos").insert({
      user_id: user?.id,
      nome,
      preco: parseFloat(preco),
      duracao: parseInt(duracao),
    });

    if (error) {
      setMensagem("Erro ao salvar serviço.");
    } else {
      setNome("");
      setPreco("");
      setDuracao("");
      setMensagem("Serviço adicionado!");
      carregarServicos();
    }

    setLoading(false);
  }

  async function handleExcluir(id: string) {
    await supabase.from("servicos").delete().eq("id", id);
    carregarServicos();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <a href="/painel" className="text-xl font-bold">ClienteMarcado</a>
        <a href="/painel" className="text-zinc-400 hover:text-white text-sm transition">← Voltar ao painel</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Meus serviços</h2>
        <p className="text-zinc-400 mb-8">Cadastre os serviços que você oferece</p>

        {/* Formulário */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Adicionar novo serviço</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome do serviço</label>
              <input
                type="text"
                placeholder="Ex: Corte de cabelo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Preço (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 35"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Duração (minutos)</label>
                <input
                  type="number"
                  placeholder="Ex: 30"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {mensagem && (
              <p className="text-sm text-orange-400">{mensagem}</p>
            )}

            <button
              onClick={handleAdicionarServico}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Adicionar serviço"}
            </button>
          </div>
        </div>

        {/* Lista de serviços */}
        <div className="flex flex-col gap-3">
          {servicos.length === 0 && (
            <p className="text-zinc-500 text-center py-8">Nenhum serviço cadastrado ainda.</p>
          )}
          {servicos.map((s) => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.nome}</p>
                <p className="text-zinc-400 text-sm">R$ {s.preco.toFixed(2)} · {s.duracao} minutos</p>
              </div>
              <button
                onClick={() => handleExcluir(s.id)}
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