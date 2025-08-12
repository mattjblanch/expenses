import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExportsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('exports').select('*').order('created_at', { ascending: false })
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Export history</h1>
      <div className="space-y-2">
        {(data ?? []).map((e:any)=> (
          <div key={e.id} className="card">
            <div>Period: {e.period_start} → {e.period_end}</div>
            <div>Items: {e.items_count} • Total: {e.total_amount} {e.currency}</div>
          </div>
        ))}
      </div>
    </main>
  )
}