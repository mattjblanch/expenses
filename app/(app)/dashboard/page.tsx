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

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, description, vendor, amount, currency, date')
    .eq('user_id', user.id)
    .is('export_id', null)
    .order('date', { ascending: false })

  const total = expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) ?? 0
  const count = expenses?.length ?? 0
  const list = expenses ?? []

  return (
    <main className="container py-6">
      <UserHeader />
      <div className="grid gap-3">
        <div className="card">
          <h2 className="font-semibold mb-2">Unclaimed Expenses</h2>
          <p className="text-sm">Total value: {aud.format(total)}</p>
          <p className="text-sm">Total expenses: {count}</p>
          <ul className="mt-2 grid gap-3">
            {list.map((e: any) => (
              <li key={e.id}>
                <Link href={`/expenses/${e.id}`} className="card block">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold">Date</span>
                    <span>{e.date?.slice(0, 10)}</span>
                    <span className="font-semibold">Vendor</span>
                    <span>{e.vendor || '—'}</span>
                    <span className="font-semibold">Description</span>
                    <span>{e.description || '—'}</span>
                    <span className="font-semibold">Amount</span>
                    <span className="justify-self-end">{aud.format(e.amount)}</span>
                  </div>
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