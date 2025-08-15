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
    .select('id, vendor, description, amount, currency, date, pending, export_id')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const unexported = (expenses ?? []).filter((e: any) => !e.export_id)
  const exported = (expenses ?? []).filter((e: any) => e.export_id)

  return (
    <main className="container py-6">
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="ml-auto">
          <ExportsPane />
        </div>
      </div>
      <details className="mb-4">
        <summary className="cursor-pointer underline text-sm text-neutral-600 mb-2">
          Show exported expenses
        </summary>
        <div className="mt-2">
          <div className="grid grid-cols-4 gap-4 pb-2 font-medium text-sm">
            <div>Date</div>
            <div>Vendor</div>
            <div>Description</div>
            <div className="justify-self-end">Amount</div>
          </div>
          <div className="divide-y mb-4">
            {exported.map((e: any) => (
              <div
                key={e.id}
                className="grid grid-cols-4 items-center py-2 gap-4"
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
            {!exported.length && (
              <p className="text-sm text-neutral-600">No exported expenses</p>
            )}
          </div>
        </div>
      </details>
      <div className="grid grid-cols-4 gap-4 pb-2 font-medium text-sm">
        <div>Date</div>
        <div>Vendor</div>
        <div>Description</div>
        <div className="justify-self-end">Amount</div>
      </div>
      <div className="divide-y">
        {unexported.map((e: any) => (
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
        {!unexported.length && (
          <p className="text-sm text-neutral-600">No expenses</p>
        )}
      </div>
    </main>
  )
}
