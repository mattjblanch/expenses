import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import Mailjet from 'node-mailjet'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  const { data: exp, error } = await supabase
    .from('exports')
    .select('file_path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (error || !exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const download = async (name: string) => {
    const { data } = await supabase.storage.from('exports').download(`${exp.file_path}/${name}`)
    if (!data) return null
    const buffer = Buffer.from(await data.arrayBuffer())
    const contentType = name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.csv') ? 'text/csv' : 'application/zip'
    return { ContentType: contentType, Filename: name, Base64Content: buffer.toString('base64') }
  }
  const attachments = (await Promise.all([
    download('expense-form.pdf'),
    download('expenses.csv'),
    download('receipts.zip'),
  ])).filter(Boolean) as any[]
  const totalSize = attachments.reduce((s, a) => s + Buffer.byteLength(a.Base64Content, 'base64'), 0)
  const { data: urlData } = await supabase.storage.from('exports').createSignedUrl(`${exp.file_path}/export.zip`, 60 * 60 * 24)
  const signedUrl = urlData?.signedUrl
  try {
    const client = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY || '',
      apiSecret: process.env.MAILJET_API_SECRET || '',
    })
    const message: any = {
      From: { Email: process.env.MAILJET_FROM || 'noreply@example.com' },
      To: [{ Email: email }],
      Subject: 'Expense export',
      TextPart: totalSize > 15 * 1024 * 1024
        ? `Your export is ready. Download it here: ${signedUrl}`
        : 'Please find attached your exported expenses.',
    }
    if (totalSize <= 15 * 1024 * 1024) {
      message.Attachments = attachments
    }
    await client.post('send', { version: 'v3.1' }).request({ Messages: [message] })
  } catch (err) {
    console.error('Failed to send export email', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
