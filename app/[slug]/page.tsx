import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!perfil) return notFound()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('user_id', perfil.user_id)

  const { data: profissionais } = await supabase
    .from('profissionais')
    .select('*')
    .eq('user_id', perfil.user_id)

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Hero */}
      <div className="border-b border-zinc-800 px-6 py-16 text-center">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Agendamento online</p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">{perfil.nome_negocio}</h1>
        {perfil.endereco && (
          <p className="text-zinc-400 text-sm mb-8">{perfil.endereco}</p>
        )}
        <Link
          href={`/${slug}/agendar`}
          className="inline-block bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-zinc-100 transition text-sm tracking-wide"
        >
          Agendar agora
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12 space-y-12">

        {/* Serviços */}
        {servicos && servicos.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Serviços</h2>
            <ul className="space-y-3">
              {servicos.map((s) => (
                <li key={s.id} className="flex justify-between items-center border border-zinc-800 rounded-2xl px-5 py-4 hover:border-zinc-600 transition">
                  <span className="font-medium">{s.nome}</span>
                  <span className="text-zinc-400 text-sm font-semibold">R$ {s.preco}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Profissionais */}
        {profissionais && profissionais.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Equipe</h2>
            <ul className="grid grid-cols-2 gap-3">
              {profissionais.map((p) => (
                <li key={p.id} className="border border-zinc-800 rounded-2xl px-5 py-4 text-center hover:border-zinc-600 transition">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-lg font-bold text-zinc-300">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{p.nome}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA final */}
        <div className="border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-400 text-sm mb-4">Pronto para agendar?</p>
          <Link
            href={`/${slug}/agendar`}
            className="inline-block bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-zinc-100 transition text-sm tracking-wide"
          >
            Agendar agora
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs pb-4">
          Agendamento via <span className="text-zinc-400">ClienteMarcado</span>
        </p>

      </div>
    </main>
  )
}