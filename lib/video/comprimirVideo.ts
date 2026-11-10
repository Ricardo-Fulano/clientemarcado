'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const CORE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'
const LIMITE_BYTES = 25 * 1024 * 1024

/**
 * Processa MP4 antes de enviar ao Supabase. Falhas reais sao propagadas:
 * nao enviamos silenciosamente o original fingindo que ele foi comprimido.
 * Se o original ja for menor do que a versao gerada, ele e preservado.
 */
export async function comprimirVideo(file: File): Promise<File> {
  if (typeof window === 'undefined') throw new Error('Compressao disponivel apenas no navegador.')
  if (file.type !== 'video/mp4') throw new Error('Selecione um arquivo MP4.')
  if (file.size > LIMITE_BYTES) throw new Error('O video deve ter no maximo 25 MB.')
  if (file.size < 2 * 1024 * 1024) return file

  const ffmpeg = new FFmpeg()
  const logs: string[] = []
  ffmpeg.on('log', ({ message }) => {
    logs.push(message)
    if (logs.length > 30) logs.shift()
  })

  try {
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${CORE_URL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    ])
    await ffmpeg.load({ coreURL, wasmURL })
    await ffmpeg.writeFile('entrada.mp4', await fetchFile(file))

    // H.264 + yuv420p para navegadores, com formato adequado ao streaming.
    // Mantem a proporcao; limita a largura/altura a 960 px, sem aumentar o video.
    const codigo = await ffmpeg.exec([
      '-i', 'entrada.mp4',
      '-map', '0:v:0', '-an',
      '-vf', 'scale=960:960:force_original_aspect_ratio=decrease:force_divisible_by=2',
      '-c:v', 'libx264', '-preset', 'superfast', '-crf', '30',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-y', 'saida.mp4',
    ], 240_000)

    if (codigo !== 0) {
      throw new Error(`FFmpeg encerrou com codigo ${codigo}. ${logs.slice(-5).join(' | ')}`)
    }

    const resultado = await ffmpeg.readFile('saida.mp4')
    if (typeof resultado === 'string' || resultado.length === 0) {
      throw new Error('O FFmpeg nao gerou um MP4 valido.')
    }

    const bytes = new Uint8Array(resultado.length)
    bytes.set(resultado)
    const blob = new Blob([bytes], { type: 'video/mp4' })

    // Se a codificacao aumentou o tamanho, nao piora o trafego.
    if (blob.size >= file.size) {
      console.info('[MiniPage video] Arquivo original menor que a versao recodificada.')
      return file
    }

    // Verifica se o navegador reconhece o video gerado antes de subir ao Supabase.
    const url = URL.createObjectURL(blob)
    try {
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video')
        let concluido = false
        const terminar = (ok: boolean) => {
          if (concluido) return
          concluido = true
          video.removeAttribute('src')
          video.load()
          if (ok) resolve()
          else reject(new Error('O navegador nao conseguiu ler o MP4 comprimido.'))
        }
        video.preload = 'metadata'
        video.onloadedmetadata = () => terminar(video.videoWidth > 0 && video.videoHeight > 0)
        video.onerror = () => terminar(false)
        video.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }

    console.info(`[MiniPage video] ${file.size} bytes -> ${blob.size} bytes`)
    return new File([blob], file.name.replace(/\.mp4$/i, '') + '-otimizado.mp4', {
      type: 'video/mp4', lastModified: Date.now(),
    })
  } catch (erro) {
    console.error('[MiniPage video] Compressao falhou:', erro, logs.slice(-8))
    throw erro instanceof Error ? erro : new Error('Falha ao comprimir video.')
  } finally {
    ffmpeg.terminate()
  }
}
