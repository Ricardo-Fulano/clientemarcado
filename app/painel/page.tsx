"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Painel() {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUsuario() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
      } else {
        setUsuario(data.user);
      }
      setLoading(false);
    }
    getUsuario();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <h1 className="text-xl font-bold">ClienteMarcado</h1>
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          Sair
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao seu painel 👋</h2>
        <p className="text-zinc-400 mb-10">{usuario?.email}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Agendamentos hoje</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Total este mês</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Clientes cadastrados</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <a href="/painel/servicos" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Meus serviços</p>
            <p className="text-zinc-400 text-sm">Cadastre e edite seus serviços e preços</p>
          </a>
          <a href="/painel/profissionais" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Minha equipe</p>
            <p className="text-zinc-400 text-sm">Gerencie seus profissionais e horários</p>
          </a>
          <a href="/painel/agendamentos" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Agenda</p>
            <p className="text-zinc-400 text-sm">Veja e gerencie seus agendamentos</p>
          </a>
          <a href="/painel/atendimento" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Registrar atendimento</p>
            <p className="text-zinc-400 text-sm">Registre atendimentos presenciais na hora</p>
          </a>
          <a href="/painel/financeiro" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Financeiro</p>
            <p className="text-zinc-400 text-sm">Controle suas despesas e receitas</p>
          </a>
          <a href="/painel/perfil" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 text-left transition">
            <p className="text-lg font-semibold mb-1">Meu perfil</p>
            <p className="text-zinc-400 text-sm">Edite as informações do seu negócio</p>
          </a>
        </div>
      </div>
    </main>
  );
}