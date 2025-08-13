'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExportExpenses({ initialExpenses, userEmail }:{ initialExpenses: any[], userEmail: string }) {
  const [selected, setSelected] = useState<string[]>(initialExpenses.map(e=> e.id))
  const [email, setEmail] = useState<string>(userEmail)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const submit = async () => {
    setLoading(true)
    const res = await fetch('/api/exports/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, email })
    })
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      console.error('Failed to export expenses', await res.text())
    }
  }

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Export expenses</h1>
      <div className="card space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e=> setEmail(e.target.value)} />
        <div className="max-h-64 overflow-y-auto divide-y">
          {initialExpenses.map(e => (
            <label key={e.id} className="flex items-center gap-2 py-2 text-sm">
              <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
              <span className="flex-1">{e.vendor || '—'} — {e.category || '—'} — {e.amount} {e.currency}</span>
            </label>
          ))}
          {!initialExpenses.length && <p className="text-sm text-neutral-600">No expenses available</p>}
        </div>
        <button disabled={!selected.length || loading} onClick={submit} className="bg-black text-white py-2 rounded-md">
          {loading ? 'Exporting…' : 'Confirm export'}
        </button>
      </div>
    </main>
  )
}
