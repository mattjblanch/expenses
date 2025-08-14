import ExportExpenses from './ExportExpenses'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function NewExportPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, currency, date, vendor, category')
    .eq('user_id', user.id)
    .eq('pending', false)
    .is('export_id', null)
    .order('date', { ascending: false })

  return <ExportExpenses initialExpenses={expenses ?? []} userEmail={user.email ?? ''} />
}
