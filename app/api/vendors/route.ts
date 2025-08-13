import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, created_at, expenses(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const mapped = (data ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    created_at: v.created_at,
    expense_count: v.expenses?.[0]?.count ?? 0,
  }))
  return NextResponse.json(mapped)
}
