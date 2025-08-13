import { serverClient } from '@/lib/supabase/server'

export default async function UserHeader() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const name = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || email
  return (
    <div className="mb-4">
      <div className="text-sm text-neutral-500">Signed in as</div>
      <div className="font-medium">{name}</div>
      <div className="text-xs text-neutral-500">{email}</div>
    </div>
  )
}