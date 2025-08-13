import Link from 'next/link'

export default function Menu() {
  return (
    <details className="relative">
      <summary className="px-3 py-2 rounded-md border cursor-pointer select-none">Menu</summary>
      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md z-10">
        <Link href="/expenses" className="block px-4 py-2 hover:bg-neutral-100">Expenses</Link>
        <details>
          <summary className="px-4 py-2 hover:bg-neutral-100 cursor-pointer">Entities</summary>
          <div>
            <Link href="/accounts" className="block px-8 py-2 hover:bg-neutral-100">Accounts</Link>
            <Link href="/categories" className="block px-8 py-2 hover:bg-neutral-100">Categories</Link>
            <Link href="/vendors" className="block px-8 py-2 hover:bg-neutral-100">Vendors</Link>
          </div>
        </details>
        <Link href="/settings" className="block px-4 py-2 hover:bg-neutral-100">Profile</Link>
      </div>
    </details>
  )
}
