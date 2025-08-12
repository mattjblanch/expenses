import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { buildExpenseFormPdf } from '@/lib/pdf'
import { toCsv } from '@/lib/csv'

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: Request) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { month, includeExported = false, currency } = await req.json()
  if (!month) return NextResponse.json({ error: 'month is required YYYY-MM' }, { status: 400 })
  const start = month + '-01'
  const end = month + '-31'

  let q = supabase.from('expenses')
    .select('id, amount, currency, occurred_on, description, category_id, account_id, receipt_path, is_exported')
    .eq('user_id', user.id)
    .gte('occurred_on', start).lte('occurred_on', end)
  if (!includeExported) q = q.eq('is_exported', false)
  const { data: expenses, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = (expenses || []).reduce((s, e:any)=> s + Number(e.amount || 0), 0)
  const chosenCurrency = (currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'AUD').toUpperCase()

  const csv = toCsv((expenses || []).map((r:any)=>({ ...r })))
  const pdfBytes = await buildExpenseFormPdf({
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'SpendWise',
    userEmail: user.email || '',
    periodLabel: month,
    totals: { total, currency: chosenCurrency, count: expenses?.length || 0 }
  })

  const zip = new JSZip()
  const folder = zip.folder(`export`)!
  folder.file(`expenses-${month}.csv`, csv)
  folder.file(`expense-form.pdf`, pdfBytes)
  const receiptsFolder = folder.folder('receipts')!

  for (const e of expenses || []) {
    if (e.receipt_path) {
      const { data: file } = await supabase.storage.from('receipts').download(e.receipt_path)
      if (file) {
        const parts = e.receipt_path.split('/')
        const filename = parts[parts.length-1]
        receiptsFolder.file(`${e.id}-${sanitize(filename)}`, Buffer.from(await file.arrayBuffer()))
      }
    }
  }

  const zipBytes = await zip.generateAsync({ type: 'uint8array' })
  const filePath = `exports/${user.id}/${month}/export-${Date.now()}.zip`
  await supabase.storage.from('exports').upload(filePath, zipBytes, { contentType: 'application/zip', upsert: true })

  const { data: created, error: e2 } = await supabase.from('exports').insert({
    user_id: user.id,
    period_start: start,
    period_end: end,
    file_path: filePath,
    total_amount: total,
    currency: chosenCurrency,
    items_count: expenses?.length || 0,
  }).select().single()
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  // mark expenses exported
  if (expenses && expenses.length) {
    await supabase.from('expenses').update({ is_exported: true, export_id: created.id }).in('id', expenses.map((e:any)=> e.id))
  }

  const { data: urlData } = await supabase.storage.from('exports').createSignedUrl(filePath, 60)
  return NextResponse.json({ exportId: created.id, itemsCount: created.items_count, totalAmount: created.total_amount, signedUrl: urlData?.signedUrl })
}