'use client'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton({ className = 'px-3 py-2 rounded-md border' }: { className?: string }) {
  const router = useRouter()
  const onClick = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <button onClick={onClick} className={className}>
      Log out
    </button>
  )
}