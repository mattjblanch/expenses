'use client'

import { useEffect, useState } from 'react'

interface Account {
  id: string
  name: string
  created_at: string
  expense_count: number
}

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])

  const fetchAccounts = () => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then(setAccounts)
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    fetchAccounts()
  }

  return (
    <div className="space-y-2">
      {accounts.map((a) => (
        <div key={a.id} className="card flex items-center justify-between">
          <span>{a.name}</span>
          {a.expense_count === 0 && (
            <button
              onClick={() => handleDelete(a.id)}
              className="px-2 py-1 text-sm bg-red-500 text-white rounded w-fit"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
