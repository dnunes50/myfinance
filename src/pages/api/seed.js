import { createClient } from '@supabase/supabase-js'
import { LANCAMENTOS_BASE } from '../../lib/lancamentos'
import { ORC_CATEGORIAS } from '../../lib/constantes'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Sem token' })
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await sb.auth.getUser()
  if (authError || !user) return res.status(401).json({ error: 'Não autenticado' })
  try {
    const { count } = await sb.from('lancamentos').select('*', { count:'exact', head:true })
    if ((count || 0) > 0) return res.status(200).json({ message: 'Já importado', count })
    const lancs = LANCAMENTOS_BASE.map(({ id, desc, ...l }) => ({ ...l, descricao: desc }))
    for (let i = 0; i < lancs.length; i += 50) {
      const { error } = await sb.from('lancamentos').insert(lancs.slice(i, i+50))
      if (error) throw error
    }
    const orcs = ORC_CATEGORIAS.map(c => ({ cat:c.cat, valor_default:c.default, custom_meses:{}, tipo:c.tipo }))
    await sb.from('orcamento').upsert(orcs, { onConflict: 'cat' })
    return res.status(200).json({ success: true, lancamentos: lancs.length })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
