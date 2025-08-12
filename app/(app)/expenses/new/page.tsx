'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewExpensePage() {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'AUD')
  const [occurred_on, setOccurredOn] = useState(new Date().toISOString().slice(0,10))
  const [description, setDescription] = useState('')
  const router = useRouter()

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id, amount: Number(amount || 0), currency, occurred_on, description
    })
    if (!error) router.push('/dashboard')
  }

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Add expense</h1>
      <div className="card space-y-3">
        <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
        <input placeholder="Currency (e.g., AUD)" value={currency} onChange={e=>setCurrency(e.target.value.toUpperCase())} />
        <input type="date" value={occurred_on} onChange={e=>setOccurredOn(e.target.value)} />
        <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <button onClick={submit} className="bg-black text-white py-2 rounded-md">Save</button>
      </div>
    </main>
  )
}