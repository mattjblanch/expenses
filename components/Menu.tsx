"use client"

import { useState } from 'react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function Menu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="p-2"
      >
        <span className="block w-6 h-0.5 bg-current mb-1"></span>
        <span className="block w-6 h-0.5 bg-current mb-1"></span>
        <span className="block w-6 h-0.5 bg-current"></span>
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white sb-2 z-50 transform transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-end">
          <button onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <Link
          href="/expenses"
          className="block px-4 py-2 hover:bg-neutral-100"
          onClick={() => setOpen(false)}
        >
          Expenses
        </Link>
        <details>
          <summary className="px-4 py-2 hover:bg-neutral-100 cursor-pointer">
            Entities
          </summary>
          <div>
            <Link
              href="/categories"
              className="block px-8 py-2 hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              Categories
            </Link>
            <Link
              href="/vendors"
              className="block px-8 py-2 hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              Vendors
            </Link>
          </div>
        </details>
        <LogoutButton
          className="block w-full text-left px-4 py-2 hover:bg-neutral-100"
        />
      </nav>
    </>
  )
}
