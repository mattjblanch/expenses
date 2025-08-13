import { serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoriesList from './CategoriesList'

export default async function CategoriesPage() {
  const supabase = serverClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Categories</h1>
      <CategoriesList />
    </main>
  )
}
