import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: exp, error: e1 } = await supabase.from('exports').select('file_path').eq('id', params.id).eq('user_id', user.id).single()
  if (e1 || !exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data, error } = await supabase.storage.from('exports').createSignedUrl(exp.file_path, 60)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ url: data.signedUrl })
}