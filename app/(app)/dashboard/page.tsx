import UserHeader from '@/components/UserHeader'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

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
          <ul className="mt-2 divide-y">
            {recent.map((e: any) => (
              <li key={e.id} className="grid grid-cols-4 items-center py-2 gap-2">
                <Link className="underline" href={`/expenses/${e.id}`}>
                  {e.date?.slice(0, 10)}
                </Link>
                <span>{e.vendor || '—'}</span>
                <span>{e.description || '—'}</span>
                <Link
                  className="underline justify-self-end"
                  href={`/expenses/${e.id}`}
                >
                  {aud.format(e.amount)}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/expenses/new"
            className="bg-black text-white py-2 rounded-md block text-center mt-2"
          >
            Add expense
          </Link>
        </div>
      </div>
    </main>
  )
}