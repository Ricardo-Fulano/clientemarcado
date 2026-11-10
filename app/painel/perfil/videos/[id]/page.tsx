'use client'
import { useParams } from 'next/navigation'
import EditorVideos from '../EditorVideos'
export default function VideosDaSecao(){
  const params=useParams<{id:string}>()
  return <EditorVideos secaoId={params.id}/>
}
