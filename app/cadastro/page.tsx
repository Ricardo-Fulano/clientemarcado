export default function Cadastro() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-white">
            ClienteMarcado
          </a>
          <p className="text-zinc-400 mt-2">Crie sua conta gratuitamente</p>
        </div>

        {/* Formulário */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex flex-col gap-4">
            
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nome do negócio</label>
              <input
                type="text"
                placeholder="Ex: Barbearia do João"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Seu nome</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">E-mail</label>
              <input
                type="email"
                placeholder="joao@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition mt-2">
              Criar minha conta
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