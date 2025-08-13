import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  const includeExported = url.searchParams.get('includeExported') === 'true'

  let query = supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false })
  if (month) {
    const start = month + '-01'
    const end = month + '-31'
    query = query.gte('date', start).lte('date', end)
  }
  if (!includeExported) query = query.is('export_id', null)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const insert = {
    ...body,
    // ensure numeric and date types are stored correctly
    amount: Number(body.amount),
    date: new Date(body.date).toISOString(),
    user_id: user.id,
  }
  const { data, error } = await supabase.from('expenses').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}