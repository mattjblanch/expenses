import UserHeader from '@/components/UserHeader'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ym = new Date().toISOString().slice(0,7)
  const { data: totals } = await supabase.rpc('get_month_totals', { ym }) // optional if you add such a RPC; ignore failure

  return (
    <main className="container py-6">
      <UserHeader />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2">Quick stats</h2>
          <p className="text-sm text-neutral-600">Month: {ym}</p>
          <p className="text-sm">Total: {totals?.total ?? 0}</p>
          <a className="underline mt-2 inline-block" href="/expenses/new">Add expense</a>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Exports</h2>
          <a className="underline" href="/exports">View export history</a>
        </div>
      </div>
    </main>
  )
}