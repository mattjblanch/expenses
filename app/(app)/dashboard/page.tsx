import UserHeader from '@/components/UserHeader'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ym = new Date().toISOString().slice(0,7)
  const start = ym + '-01'
  const end = ym + '-31'
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  const total = monthExpenses?.reduce((sum: number, e: any) => sum + e.amount, 0) ?? 0
  const recent = monthExpenses?.slice(0,5) ?? []

  return (
    <main className="container py-6">
      <UserHeader />
      <div className="grid gap-3">
        <div className="card">
          <h2 className="font-semibold mb-2">Quick stats</h2>
          <p className="text-sm text-neutral-600">Month: {ym}</p>
          <p className="text-sm">Total: {total}</p>
          <ul className="mt-2 space-y-1">
            {recent.map((e: any) => (
              <li key={e.id}>
                <Link className="underline" href={`/expenses/${e.id}`}>
                  {e.vendor || e.description || 'View expense'}
                </Link>
              </li>
            ))}
          </ul>
          <a className="underline mt-2 inline-block" href="/expenses/new">Add expense</a>
        </div>
      </div>
    </main>
  )
}