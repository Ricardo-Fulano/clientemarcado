'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Bloqueios() {
  const router = useRouter()
  useEffect(() => { router.replace('/painel/agendamentos') }, [])
  return null
}
