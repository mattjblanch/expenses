import { redirect } from 'next/navigation'
import { serverClient } from './supabase/server'
import { cookies } from 'next/headers'

export async function getUserOrRedirect() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

type EnsureProfileInput = { id: string; email?: string | null; user_metadata?: Record<string, any> | null }

export async function ensureProfile(u: EnsureProfileInput) {
  const supabase = serverClient()
  const fullName =
    (u.user_metadata?.full_name as string | undefined) ||
    (u.user_metadata?.name as string | undefined) ||
    u.email ||
    null
  const avatar_url = (u.user_metadata?.avatar_url as string | undefined) || null

  await supabase.from('profiles').upsert(
    { id: u.id, full_name: fullName, avatar_url },
    { onConflict: 'id' }
  )
}