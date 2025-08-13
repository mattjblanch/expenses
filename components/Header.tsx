import Link from 'next/link'
import Menu from './Menu'

export default function Header() {
  return (
    <header className="border-b mb-6">
      <div className="container flex items-center justify-between py-4">
        <Link href="/dashboard" className="font-semibold">
          Dashboard
        </Link>
        <Menu />
      </div>
    </header>
  )
}
