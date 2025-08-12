import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function VendorsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Vendors</h1>
      <div className="space-y-2">
        {(data ?? []).map((v:any)=> <div key={v.id} className="card">{v.name}</div>)}
      </div>
    </main>
  )
}
