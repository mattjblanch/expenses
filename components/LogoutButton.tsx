'use client'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const onClick = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  return <button onClick={onClick} className="px-3 py-2 rounded-md border">Log out</button>
}