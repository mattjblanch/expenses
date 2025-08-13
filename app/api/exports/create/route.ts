import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { buildExpenseFormPdf } from '@/lib/pdf'
import { toCsv } from '@/lib/csv'
import Mailjet from 'node-mailjet'

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: Request) {
  try {
    const supabase = serverClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { month, includeExported = false, currency, ids = [], email } = await req.json()

    let expenses: any[] | null = null
    let start = ''
    let end = ''
    let periodLabel = ''

    if (ids && ids.length) {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, currency, date, description, vendor, category, receipt_url, export_id')
        .eq('user_id', user.id)
        .in('id', ids)
      if (error) {
        console.error('Failed to load expenses for export', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      expenses = data || []
      const dates = expenses.map(e => e.date).sort()
      start = dates[0] || ''
      end = dates[dates.length - 1] || ''
      periodLabel = start && end ? `${start.slice(0,10)} to ${end.slice(0,10)}` : 'custom'
    } else {
      if (!month) return NextResponse.json({ error: 'month is required YYYY-MM' }, { status: 400 })
      start = month + '-01'
      end = month + '-31'
      let q = supabase.from('expenses')
        .select('id, amount, currency, date, description, vendor, category, receipt_url, export_id')
        .eq('user_id', user.id)
        .gte('date', start).lte('date', end)
      if (!includeExported) q = q.is('export_id', null)
      const { data, error } = await q
      if (error) {
        console.error('Failed to load expenses for export', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      expenses = data || []
      periodLabel = month
    }

    const total = (expenses || []).reduce((s, e:any)=> s + Number(e.amount || 0), 0)
    const chosenCurrency = (currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'AUD').toUpperCase()

    const csv = toCsv((expenses || []).map((r:any)=>({ ...r })))
    const pdfBytes = await buildExpenseFormPdf({
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'SpendWise',
      userEmail: user.email || '',
      periodLabel,
      totals: { total, currency: chosenCurrency, count: expenses?.length || 0 }
    })

    const receiptsZip = new JSZip()

    for (const e of expenses || []) {
      if (e.receipt_url) {
        const { data: file } = await supabase.storage.from('receipts').download(e.receipt_url)
        if (file) {
          const parts = e.receipt_url.split('/')
          const filename = parts[parts.length-1]
          receiptsZip.file(`${e.id}-${sanitize(filename)}`, Buffer.from(await file.arrayBuffer()))
        }
      }
    }

    const receiptsZipBytes = await receiptsZip.generateAsync({ type: 'uint8array' })

    const zip = new JSZip()
    const folder = zip.folder(`export`)!
    folder.file(`expenses.csv`, csv)
    folder.file(`expense-form.pdf`, pdfBytes)
    folder.file('receipts.zip', receiptsZipBytes)
    const zipBytes = await zip.generateAsync({ type: 'uint8array' })
    const filePath = `exports/${user.id}/${Date.now()}.zip`
    await supabase.storage.from('exports').upload(filePath, zipBytes, { contentType: 'application/zip', upsert: true })

    const { data: created, error: e2 } = await supabase.from('exports').insert({
      user_id: user.id,
      period_start: start || null,
      period_end: end || null,
      file_path: filePath,
      total_amount: total,
      currency: chosenCurrency,
      items_count: expenses?.length || 0,
    }).select().single()
    if (e2) {
      console.error('Failed to create export record', e2)
      return NextResponse.json({ error: e2.message }, { status: 500 })
    }

    // mark expenses exported
    if (expenses && expenses.length) {
      await supabase.from('expenses').update({ export_id: created.id }).in('id', expenses.map((e:any)=> e.id))
    }

    if (email) {
      try {
        const client = new Mailjet({
          apiKey: process.env.MAILJET_API_KEY || '',
          apiSecret: process.env.MAILJET_API_SECRET || '',
        })
        await client.post('send', { version: 'v3.1' }).request({
          Messages: [
            {
              From: { Email: process.env.MAILJET_FROM || 'noreply@example.com' },
              To: [{ Email: email }],
              Subject: 'Expense export',
              TextPart: 'Please find attached your exported expenses.',
              Attachments: [
                {
                  ContentType: 'application/pdf',
                  Filename: 'expense-form.pdf',
                  Base64Content: Buffer.from(pdfBytes).toString('base64'),
                },
                {
                  ContentType: 'text/csv',
                  Filename: 'expenses.csv',
                  Base64Content: Buffer.from(csv).toString('base64'),
                },
                {
                  ContentType: 'application/zip',
                  Filename: 'receipts.zip',
                  Base64Content: Buffer.from(receiptsZipBytes).toString('base64'),
                },
              ],
            },
          ],
        })
      } catch (err) {
        console.error('Failed to send export email', err)
      }
    }

    const { data: urlData } = await supabase.storage.from('exports').createSignedUrl(filePath, 60)
    return NextResponse.json({ exportId: created.id, itemsCount: created.items_count, totalAmount: created.total_amount, signedUrl: urlData?.signedUrl })
  } catch (err) {
    console.error('Failed to create export', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
