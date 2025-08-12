import UserHeader from '@/components/UserHeader'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExportsPane from './ExportsPane'

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
      <div className="space-y-2">
        {(expenses ?? []).map((e: any) => (
          <div key={e.id} className="card space-y-1">
            <div>Vendor: {e.vendor || '—'}</div>
            <div>Description: {e.description || '—'}</div>
            <div>Amount: {e.amount} {e.currency}</div>
            <div>Date: {e.date?.slice(0, 10)}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
