import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExportsPane from './ExportsPane'
import Link from 'next/link'

export const revalidate = 0

const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

export default async function ExpensesPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, vendor, description, amount, currency, date, pending')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return (
    <main className="container py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <ExportsPane />
      </div>
      <div className="grid grid-cols-4 gap-4 pb-2 font-medium text-sm">
        <div>Date</div>
        <div>Vendor</div>
        <div>Description</div>
        <div className="justify-self-end">Amount</div>
      </div>
      <div className="divide-y">
        {(expenses ?? []).map((e: any) => (
          <div
            key={e.id}
            className={`grid grid-cols-4 items-center py-2 gap-4 ${e.pending ? 'bg-orange-100' : ''}`}
          >
            <Link className="underline" href={`/expenses/${e.id}`}>
              {e.date?.slice(0, 10)}
            </Link>
            <Link className="underline" href={`/expenses/${e.id}`}>
              {e.vendor || '—'}
            </Link>
            <Link className="underline" href={`/expenses/${e.id}`}>
              {e.description || '—'}
            </Link>
            <Link className="underline justify-self-end" href={`/expenses/${e.id}`}>
              {aud.format(e.amount)}
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
