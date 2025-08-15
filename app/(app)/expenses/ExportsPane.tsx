'use client'

import { useEffect, useState } from 'react'

export default function ExportsPane() {
  const [open, setOpen] = useState(false)
  const [exports, setExports] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      fetch('/api/exports')
        .then((res) => res.json())
        .then(setExports)
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-md border text-sm text-neutral-600"
      >
        Exports
      </button>
      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <button onClick={() => setOpen(false)} className="underline mb-2">Close</button>
          <h2 className="font-semibold mb-4">Export history</h2>
          <div className="space-y-2 overflow-y-auto">
            {exports.map((e: any) => (
              <div key={e.id} className="card">
                <div>Period: {e.period_start} → {e.period_end}</div>
                <div>Items: {e.items_count} • Total: {e.total_amount} {e.currency}</div>
              </div>
            ))}
            {!exports.length && <p className="text-sm text-neutral-600">No exports</p>}
          </div>
        </div>
      </div>
    </>
  )
}
