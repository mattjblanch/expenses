import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { count, error: countError } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', params.id)
    .eq('user_id', user.id)
  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 })
  if (count && count > 0) {
    return NextResponse.json({ error: 'Vendor has expenses' }, { status: 400 })
  }

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}
