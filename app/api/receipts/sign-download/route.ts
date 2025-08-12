import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { path } = await req.json()
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ url: data.signedUrl })
}