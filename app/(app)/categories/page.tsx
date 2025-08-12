import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CategoriesPage() {
  const supabase = serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false })
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Categories</h1>
      <div className="space-y-2">
        {(data ?? []).map((c:any)=> <div key={c.id} className="card">{c.name}</div>)}
      </div>
    </main>
  )
}