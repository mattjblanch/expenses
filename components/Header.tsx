import Link from 'next/link'
import Menu from './Menu'
import { serverClient } from '@/lib/supabase/server'

export default async function Header() {
  const supabase = serverClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const name =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    email

  return (
    <header className="border-b sb-2 mb-6">
      <div className="container flex items-center justify-between py-4">
        <Link href="/dashboard" className="font-semibold">
          SpendWise
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 sb-2">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                {name?.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:inline">{name}</span>
            </div>
          )}
          <Menu />
        </div>
      </div>
    </header>
  )
}
