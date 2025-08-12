export default function EntitiesMenu() {
  return (
    <details className="relative">
      <summary className="px-3 py-2 rounded-md border cursor-pointer select-none">Entities</summary>
      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md z-10">
        <a href="/vendors" className="block px-4 py-2 hover:bg-neutral-100">Vendors</a>
        <a href="/categories" className="block px-4 py-2 hover:bg-neutral-100">Categories</a>
        <a href="/accounts" className="block px-4 py-2 hover:bg-neutral-100">Accounts</a>
      </div>
    </details>
  )
}
