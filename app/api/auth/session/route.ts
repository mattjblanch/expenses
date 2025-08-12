import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  return NextResponse.json({ user })
}