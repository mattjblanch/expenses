'use client'

import { useEffect, useState } from 'react'

export default function ExportsPane() {
  const [open, setOpen] = useState(false)
  const [exports, setExports] = useState<any[]>([])
  const [files, setFiles] = useState<Record<string, any>>({})

  useEffect(() => {
    if (open) {
      fetch('/api/exports')
        .then((res) => res.json())
        .then(setExports)
    }
  }, [open])

  const toggle = async (id: string) => {
    if (files[id]) {
      setFiles((f) => {
        const copy = { ...f }
        delete copy[id]
        return copy
      })
    } else {
      const res = await fetch(`/api/exports/${id}/files`)
      const data = await res.json()
      setFiles((f) => ({ ...f, [id]: data }))
    }
  }

  const send = async (id: string) => {
    const email = prompt('Send to email:')
    if (!email) return
    await fetch(`/api/exports/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    alert('Sent')
  }

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
                <button onClick={() => toggle(e.id)} className="text-left w-full">
                  <div>Period: {e.period_end.slice(0, 10)}</div>
                  <div>Transactions: {e.items_count} • Total: {e.total_amount} {e.currency}</div>
                </button>
                {files[e.id] && (
                  <div className="mt-2 text-sm">
                    <a href={files[e.id].pdfUrl} className="underline block" target="_blank">expense-form.pdf</a>
                    <a href={files[e.id].csvUrl} className="underline block" target="_blank">expenses.csv</a>
                    <a href={files[e.id].receiptsUrl} className="underline block" target="_blank">receipts.zip</a>
                    <a href={files[e.id].zipUrl} className="underline block" target="_blank">export.zip</a>
                    <button onClick={() => send(e.id)} className="underline block text-left mt-2">Send to email</button>
                  </div>
                )}
              </div>
            ))}
            {!exports.length && <p className="text-sm text-neutral-600">No exports</p>}
          </div>
        </div>
      </div>
    </>
  )
}
