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

  // validate and normalise amount
  const amount = Number(body.amount)
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // validate and normalise date
  const dateObj = new Date(body.date)
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  let vendor_id: string | null = null
  if (body.vendor && String(body.vendor).trim() !== '') {
    const { data: existingVendor, error: vendorFetchError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.vendor)
      .maybeSingle()
    if (vendorFetchError) {
      return NextResponse.json({ error: vendorFetchError.message }, { status: 400 })
    }
    if (existingVendor) {
      vendor_id = existingVendor.id
    } else {
      const { data: newVendor, error: vendorInsertError } = await supabase
        .from('vendors')
        .insert({ name: body.vendor, user_id: user.id })
        .select('id')
        .single()
      if (vendorInsertError) {
        return NextResponse.json({ error: vendorInsertError.message }, { status: 400 })
      }
      vendor_id = newVendor.id
    }
  }

  const insert = {
    ...body,
    amount,
    date: dateObj.toISOString(),
    user_id: user.id,
    vendor_id,
  }
  const { data, error } = await supabase.from('expenses').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}