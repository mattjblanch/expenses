import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data, error } = await supabase.from('expenses').select('*').eq('id', params.id).eq('user_id', user.id).single()
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

  const update = {
    ...body,
    amount,
    date: dateObj.toISOString(),
    vendor_id,
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