import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { expenseId, filename } = await req.json()
  if (!expenseId || !filename) return NextResponse.json({ error: 'expenseId and filename required' }, { status: 400 })
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `receipts/${user.id}/${expenseId}/${safe}`
  return NextResponse.json({ path })
}