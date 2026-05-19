"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const TIPOS_NEGOCIO = [
  "Barbearia",
  "Salão de cabeleireiro",
  "Clínica estética",
  "Clínica odontológica",
  "Clínica médica",
  "Petshop",
  "Outro",
];

export default function Cadastro() {
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleCadastro() {
    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_negocio: nomeNegocio,
          tipo_negocio: tipoNegocio,
          nome_usuario: nomeUsuario,
        },
      },
    });

    if (error) {
      setMensagem("Erro: " + error.message);
    } else {
      setMensagem("Conta criada! Verifique seu e-mail para confirmar.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-white">
            ClienteMarcado
          </a>
          <p className="text-zinc-400 mt-2">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Tipo de negócio</label>
              <select
                value={tipoNegocio}
                onChange={(e) => setTipoNegocio(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione o tipo...</option>
                {TIPOS_NEGOCIO.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome do negócio</label>
              <input
                type="text"
                placeholder="Ex: Barbearia do João"
                value={nomeNegocio}
                onChange={(e) => setNomeNegocio(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Seu nome</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">E-mail</label>
              <input
                type="email"
                placeholder="joao@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {mensagem && (
              <p className="text-sm text-center text-orange-400">{mensagem}</p>
            )}

            <button
              onClick={handleCadastro}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition mt-2 disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar minha conta"}
            </button>

          </div>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Já tem conta?{" "}
            <a href="/login" className="text-orange-500 hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}