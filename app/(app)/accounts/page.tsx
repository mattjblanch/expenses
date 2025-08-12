import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: false })
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Accounts</h1>
      <div className="space-y-2">
        {(data ?? []).map((a:any)=> <div key={a.id} className="card">{a.name}</div>)}
      </div>
    </main>
  )
}