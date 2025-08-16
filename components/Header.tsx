import Link from 'next/link'
import Menu from './Menu'
import ProfileDropdown from './ProfileDropdown'
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
        <div className="flex items-center gap-4">
          <Menu />
          <Link href="/dashboard" className="font-semibold">
            SpendWise
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {user && <ProfileDropdown name={name} />}
        </div>
      </div>
    </header>
  )
}
