import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth'

export async function GET(request: Request) {
  const supabase = serverClient()
  // This will set the session cookie if the URL contains the 'code' query param
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await ensureProfile({ id: user.id, email: user.email, user_metadata: user.user_metadata as any })
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}