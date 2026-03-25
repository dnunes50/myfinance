import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { LANCAMENTOS_BASE } from '@/lib/lancamentos_base'
import { BANCOS_CONFIG, ORC_CATEGORIAS_DEFAULT } from '@/lib/dados'

export async function POST() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    // Check if already seeded
    const { count } = await supabase
      .from('lancamentos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count || 0) > 0) {
      return NextResponse.json({ message: 'Dados já importados', count })
    }

    // Insert lancamentos in batches of 50
    const lancamentos = LANCAMENTOS_BASE.map(({ id, ...l }) => ({
      ...l,
      user_id: user.id
    }))

    for (let i = 0; i < lancamentos.length; i += 50) {
      const batch = lancamentos.slice(i, i + 50)
      const { error } = await supabase.from('lancamentos').insert(batch)
      if (error) throw error
    }

    // Insert bancos
    await supabase.from('bancos').upsert(
      BANCOS_CONFIG.map(b => ({ ...b, user_id: user.id })),
      { onConflict: 'id,user_id' }
    )

    // Insert orcamento
    await supabase.from('orcamento_categorias').upsert(
      ORC_CATEGORIAS_DEFAULT.map(c => ({ ...c, user_id: user.id })),
      { onConflict: 'cat,user_id' }
    )

    // Insert configuracoes
    await supabase.from('configuracoes').insert({
      meta_patrimonio: 1000000,
      user_id: user.id
    })

    return NextResponse.json({ success: true, lancamentos: lancamentos.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
