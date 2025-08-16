import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'
import AccountsList from './AccountsList'

export default async function SettingsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .maybeSingle()
  const { data: enabled } = await supabase
    .from('user_currencies')
    .select('currency')
    .eq('user_id', user.id)
  const settings = {
    defaultCurrency: profile?.settings?.defaultCurrency || 'AUD',
    enabledCurrencies: enabled?.map((c) => c.currency) || ['AUD', 'NZD'],
  }
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <SettingsForm userId={user.id} initialSettings={settings} />
      <h2 className="text-lg font-semibold mt-8 mb-4">Accounts</h2>
      <AccountsList />
    </main>
  )
}