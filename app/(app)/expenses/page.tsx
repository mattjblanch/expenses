import UserHeader from '@/components/UserHeader'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExportsPane from './ExportsPane'
import Link from 'next/link'

export const revalidate = 0

export default async function ExpensesPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, vendor, description, amount, currency, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return (
    <main className="container py-6">
      <UserHeader />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <ExportsPane />
      </div>
      <div className="divide-y">
        {(expenses ?? []).map((e: any) => (
          <div
            key={e.id}
            className="grid grid-cols-3 items-center py-2 gap-4"
          >
            <span>{e.vendor || e.description || '—'}</span>
            <Link className="underline" href={`/expenses/${e.id}`}>
              {e.date?.slice(0, 10)}
            </Link>
            <Link className="underline justify-self-end" href={`/expenses/${e.id}`}>
              {e.amount} {e.currency}
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
