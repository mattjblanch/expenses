import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .maybeSingle()
  const settings =
    profile?.settings || { defaultCurrency: 'AUD', enabledCurrencies: ['AUD', 'NZD'] }
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <SettingsForm userId={user.id} initialSettings={settings} />
    </main>
  )
}