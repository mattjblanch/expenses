import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = serverClient()
  await supabase.auth.signOut({ scope: 'global' })
  return new NextResponse(null, { status: 204 })
}