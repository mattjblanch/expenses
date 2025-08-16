"use client"

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  list: Expense[]
  currency: string
}

const format = (currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency })

interface Expense {
  id: string
  description: string | null
  vendor: string | null
  amount: number
  currency: string
  date: string | null
}

export default function UnclaimedExpenses({ list, currency }: Props) {
  const [show, setShow] = useState(false)
  const fmt = format(currency)

  if (list.length === 0) return null

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="mt-2 text-sm text-blue-600 underline"
      >
        {show ? 'Hide expenses' : 'Show expenses'}
      </button>
      {show && (
        <ul className="mt-2 grid gap-3">
          {list.map((e) => (
            <li key={e.id}>
              <Link href={`/expenses/${e.id}`} className="card block">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <span>{e.date?.slice(0, 10)}</span>
                  <span className="justify-self-end">{fmt.format(e.amount)}</span>
                  <span className="col-span-2">{e.vendor || '—'}</span>
                  <span className="col-span-2">{e.description || '—'}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

