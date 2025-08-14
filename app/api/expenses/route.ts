import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import { parseDateInput } from '@/lib/date'

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
  const dateObj = parseDateInput(body.date)
  if (!dateObj || isNaN(dateObj.getTime())) {
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

  let category_id: string | null = null
  if (body.category && String(body.category).trim() !== '') {
    const { data: existingCategory, error: categoryFetchError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.category)
      .maybeSingle()
    if (categoryFetchError) {
      return NextResponse.json({ error: categoryFetchError.message }, { status: 400 })
    }
    if (existingCategory) {
      category_id = existingCategory.id
    } else {
      const { data: newCategory, error: categoryInsertError } = await supabase
        .from('categories')
        .insert({ name: body.category, user_id: user.id })
        .select('id')
        .single()
      if (categoryInsertError) {
        return NextResponse.json({ error: categoryInsertError.message }, { status: 400 })
      }
      category_id = newCategory.id
    }
  }

  let account_id: string | null = null
  if (body.account && String(body.account).trim() !== '') {
    const { data: existingAccount, error: accountFetchError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.account)
      .maybeSingle()
  if (accountFetchError) {
      return NextResponse.json({ error: accountFetchError.message }, { status: 400 })
    }
    if (existingAccount) {
      account_id = existingAccount.id
    } else {
      const { data: newAccount, error: accountInsertError } = await supabase
        .from('accounts')
        .insert({ name: body.account, user_id: user.id })
        .select('id')
        .single()
      if (accountInsertError) {
        return NextResponse.json({ error: accountInsertError.message }, { status: 400 })
      }
      account_id = newAccount.id
    }
  }

  const pending = body.pending === true

  const insert = {
    amount,
    currency: body.currency,
    date: dateObj.toISOString(),
    description: body.description,
    vendor: body.vendor,
    category: body.category,
    user_id: user.id,
    vendor_id,
    category_id,
    account_id,
    receipt_url: body.receipt_url,
    pending,
  }
  const { data, error } = await supabase.from('expenses').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}