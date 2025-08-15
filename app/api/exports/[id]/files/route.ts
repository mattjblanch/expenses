import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: exp, error } = await supabase
    .from('exports')
    .select('file_path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (error || !exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const makeUrl = async (name: string) => {
    const { data } = await supabase.storage.from('exports').createSignedUrl(`${exp.file_path}/${name}`, 60)
    return data?.signedUrl || ''
  }
  const urls = {
    zipUrl: await makeUrl('export.zip'),
    pdfUrl: await makeUrl('expense-form.pdf'),
    csvUrl: await makeUrl('expenses.csv'),
    receiptsUrl: await makeUrl('receipts.zip'),
  }
  return NextResponse.json(urls)
}
