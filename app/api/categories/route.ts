import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at, expenses(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const mapped = (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    expense_count: c.expenses?.[0]?.count ?? 0,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const insert = { ...body, user_id: user.id }
  const { data, error } = await supabase.from('categories').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}