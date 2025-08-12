import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  const settings = profile?.settings || { defaultCurrency: 'AUD', enabledCurrencies: ['AUD','NZD']}
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="card">
        <pre>{JSON.stringify(settings, null, 2)}</pre>
        <p className="text-sm text-neutral-600 mt-2">Edit UI not implemented in scaffold.</p>
      </div>
    </main>
  )
}