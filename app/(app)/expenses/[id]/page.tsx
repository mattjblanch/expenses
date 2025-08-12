import { serverClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function ExpensePage({ params }: { params: { id: string } }) {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('expenses').select('*').eq('id', params.id).eq('user_id', user.id).single()
  if (!data) notFound()

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Expense</h1>
      <div className="card space-y-2">
        <p>Amount: {data.amount} {data.currency}</p>
        <p>Date: {data.date?.slice(0, 10)}</p>
        {data.vendor && <p>Vendor: {data.vendor}</p>}
        {data.description && <p>Description: {data.description}</p>}
      </div>
    </main>
  )
}
