'use client'

import { useEffect, useState } from 'react'

interface Vendor {
  id: string
  name: string
  created_at: string
  expense_count: number
}

export default function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])

  const fetchVendors = () => {
    fetch('/api/vendors')
      .then((res) => res.json())
      .then(setVendors)
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleDelete = async (id: string) => {
    await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
    fetchVendors()
  }

  return (
    <div className="space-y-2">
      {vendors.map((v) => (
        <div key={v.id} className="card flex items-center justify-between">
          <span>{v.name}</span>
          {v.expense_count === 0 && (
            <button
              onClick={() => handleDelete(v.id)}
              className="px-2 py-1 text-sm bg-red-500 text-white rounded"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
