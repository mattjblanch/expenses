import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import { parseDateInput } from '@/lib/date'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data, error } = await supabase
    .from('expenses')
    .select('*, account:accounts(name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()

  const amount = Number(body.amount)
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

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

  const update = {
    amount,
    currency: body.currency,
    date: dateObj.toISOString(),
    description: body.description,
    vendor: body.vendor,
    category: body.category,
    vendor_id,
    category_id,
    account_id,
    receipt_url: body.receipt_url,
  }
  const { data, error } = await supabase
    .from('expenses')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { error } = await supabase.from('expenses').delete().eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}