'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  created_at: string
  expense_count: number
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then(setCategories)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    fetchCategories()
  }

  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <div key={c.id} className="card flex items-center justify-between">
          <span>{c.name}</span>
          {c.expense_count === 0 && (
            <button
              onClick={() => handleDelete(c.id)}
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
