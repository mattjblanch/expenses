import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UnclaimedExpenses from '@/components/UnclaimedExpenses'

export const revalidate = 0

const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

export default async function DashboardPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pendingExpenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .is('export_id', null)
    .eq('pending', true)
    .order('date', { ascending: false })

  const pendingTotal = pendingExpenses?.reduce(
    (sum: number, e: any) => sum + e.amount,
    0,
  ) ?? 0
  const pendingCount = pendingExpenses?.length ?? 0
  const pendingList = pendingExpenses ?? []

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .is('export_id', null)
    .eq('pending', false)
    .order('date', { ascending: false })

  const total = expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) ?? 0
  const count = expenses?.length ?? 0
  const list = expenses ?? []

  return (
    <main className="container py-6">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/expenses/new"
            className="px-3 py-2 rounded-md border block text-center hover:bg-neutral-100"
          >
            Add manual expense
          </Link>
          <Link
            href="/expenses/snap"
            className="px-3 py-2 rounded-md border block text-center bg-green-600 text-white hover:bg-green-700"
          >
            Snap expense
          </Link>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Unconfirmed Expenses</h2>
          <p className="text-sm">Total value: {aud.format(pendingTotal)}</p>
          <p className="text-sm">Total expenses: {pendingCount}</p>
          <ul className="mt-2 grid gap-3">
            {pendingList.map((e: any) => (
              <li key={e.id}>
                <Link href={`/expenses/${e.id}`} className="card block">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <span>{e.date?.slice(0, 10)}</span>
                    <span className="justify-self-end">{aud.format(e.amount)}</span>
                    <span className="col-span-2">{e.vendor || '—'}</span>
                    <span className="col-span-2">{e.description || '—'}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Unclaimed Expenses</h2>
          <p className="text-sm">Total value: {aud.format(total)}</p>
          <p className="text-sm">Total expenses: {count}</p>
          <UnclaimedExpenses list={list} />
          <Link
            href="/exports/new"
            className="px-3 py-2 rounded-md border block text-center mt-2 bg-red-600 text-white hover:bg-red-700"
          >
            Export expenses
          </Link>
        </div>
      </div>
    </main>
  )
}