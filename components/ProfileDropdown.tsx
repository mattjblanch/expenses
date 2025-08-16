"use client"

import { useState } from "react"
import Link from "next/link"

export default function ProfileDropdown({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const initial = name.slice(0, 1).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
          {initial}
        </div>
        <span className="text-sm hidden sm:inline">{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white sb-2 z-50">
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm hover:bg-neutral-100"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </div>
  )
}

