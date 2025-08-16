import Header from '@/components/Header'
import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = serverClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) {
    const { data } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', session.user.id)
      .single()
    if (!data?.settings?.defaultCurrency) {
      redirect('/select-currency')
    }
  }
  return (
    <>
      <Header />
      {children}
    </>
  )
}
