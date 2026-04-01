import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { sb } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
      else router.replace('/login')
    })
  }, [])
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{fontSize:'32px'}}>💰</div>
    </div>
  )
}
