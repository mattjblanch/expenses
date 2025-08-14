import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import { toCsv } from '@/lib/csv'

export async function GET(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'month is required YYYY-MM' }, { status: 400 })
  const start = month + '-01'
  const end = month + '-31'

  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, currency, date, description, vendor, category, receipt_url, export_id')
    .eq('user_id', user.id)
    .eq('pending', false)
    .gte('date', start).lte('date', end)
    .order('date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = toCsv((data || []).map((r:any)=>({ ...r })))
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=expenses-${month}.csv`,
    }
  })
}