import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UnclaimedExpenses from '@/components/UnclaimedExpenses'
import SnapExpenseButton from '@/components/SnapExpenseButton'
import { convertExpenses } from '@/lib/currency'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single()
  const defaultCurrency =
    profile?.settings?.defaultCurrency ||
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ||
    'AUD'
  const fmt = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: defaultCurrency,
  })

  const { data: pendingExpenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .is('export_id', null)
    .eq('pending', true)
    .order('date', { ascending: false })

  const pendingList = await convertExpenses(pendingExpenses ?? [], defaultCurrency)
  const pendingTotal = pendingList.reduce(
    (sum: number, e: any) => sum + e.amount,
    0,
  )
  const pendingCount = pendingList.length

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .is('export_id', null)
    .eq('pending', false)
    .order('date', { ascending: false })

  const list = await convertExpenses(expenses ?? [], defaultCurrency)
  const total = list.reduce((sum: number, e: any) => sum + e.amount, 0)
  const count = list.length

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
          <SnapExpenseButton className="px-3 py-2 rounded-md border block text-center bg-green-600 text-white hover:bg-green-700" />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Unconfirmed Expenses</h2>
          <p className="text-sm">Total value: {fmt.format(pendingTotal)}</p>
          <p className="text-sm">Total expenses: {pendingCount}</p>
          <ul className="mt-2 grid gap-3">
            {pendingList.map((e: any) => (
              <li key={e.id}>
                <Link href={`/expenses/${e.id}`} className="card block">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <span>{e.date?.slice(0, 10)}</span>
                    <span className="justify-self-end">{fmt.format(e.amount)}</span>
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
          <p className="text-sm">Total value: {fmt.format(total)}</p>
          <p className="text-sm">Total expenses: {count}</p>
          <UnclaimedExpenses list={list} currency={defaultCurrency} />
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