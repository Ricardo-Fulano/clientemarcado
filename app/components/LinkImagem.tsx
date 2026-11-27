'use client'
import { useState, type ReactNode } from 'react'
export default function LinkImagem({src,children}:{src?:string;children:ReactNode}) {
 const [failed,setFailed]=useState<string>()
 if(!src||failed===src)return <>{children}</>
 return <img src={src} alt="" loading="lazy" decoding="async" onError={()=>setFailed(src)} style={{display:'block',width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>
}
