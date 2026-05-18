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
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">{perfil.nome_negocio}</h1>
        <Link
          href={`/${slug}/agendar`}
          className="bg-orange-500 text-white font-bold px-5 py-2 rounded hover:bg-orange-600"
        >
          Agendar agora
        </Link>
      </div>
      <p className="text-gray-500 mb-6">{perfil.endereco}</p>

      <h2 className="text-xl font-semibold mb-3">Serviços</h2>
      <ul className="mb-6 space-y-2">
        {servicos?.map((s) => (
          <li key={s.id} className="border rounded p-3 flex justify-between">
            <span>{s.nome}</span>
            <span className="font-bold">R$ {s.preco}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-3">Profissionais</h2>
      <ul className="space-y-2 mb-8">
        {profissionais?.map((p) => (
          <li key={p.id} className="border rounded p-3">
            {p.nome}
          </li>
        ))}
      </ul>

      <Link
        href={`/${slug}/agendar`}
        className="block text-center bg-orange-500 text-white font-bold px-5 py-3 rounded hover:bg-orange-600"
      >
        Agendar agora
      </Link>
    </main>
  )
}