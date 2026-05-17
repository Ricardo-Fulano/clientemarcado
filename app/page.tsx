export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">ClienteMarcado</h1>
        <div className="flex gap-4">
          <a href="/login" className="text-zinc-400 hover:text-white transition">
            Entrar
          </a>
          <a href="/cadastro" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">
            Começar grátis
          </a>
        </div>
      </nav>
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <h2 className="text-5xl font-bold leading-tight mb-6">
          Seu cliente agenda sozinho.<br />
          <span className="text-orange-500">Você só atende.</span>
        </h2>
        <p className="text-zinc-400 text-xl max-w-xl mb-10">
          Plataforma de agendamento inteligente para barbearias, salões, estética e petshops.
          Sem complicação. Sem mensalidade absurda.
        </p>
        <a href="/cadastro" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
          Criar minha agenda grátis
        </a>
      </section>
    </main>
  );
}