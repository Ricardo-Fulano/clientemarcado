// Deteccao de "e-mail ja cadastrado" compartilhada entre o cadastro e o aceite de convite.
// O Supabase devolve o code "user_already_exists"/"email_exists" e mensagens como
// "User already registered" ou "A user with this email address has already been registered"
// (note "already BEEN registered"). Olhamos o code primeiro e depois varias formas de texto.
export function ehEmailJaCadastrado(err: { message?: string; code?: string } | null | undefined): boolean {
  if (!err) return false
  const code = (err.code || '').toLowerCase()
  if (code === 'email_exists' || code === 'user_already_exists') return true
  return /already\s+(been\s+)?registered|already\s+exists|user\s+already|email_exists/i.test(err.message || '')
}
