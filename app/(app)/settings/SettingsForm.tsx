'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Settings {
  defaultCurrency: string
  enabledCurrencies: string[]
}

export default function SettingsForm({
  userId,
  initialSettings,
}: {
  userId: string
  initialSettings: Settings
}) {
  const [currency, setCurrency] = useState(initialSettings.defaultCurrency)
  const [currencies, setCurrencies] = useState(
    initialSettings.enabledCurrencies
  )
  const [newCurrency, setNewCurrency] = useState('')
  const [saving, setSaving] = useState(false)

  const addCurrency = () => {
    const value = newCurrency.trim().toUpperCase()
    if (!value || currencies.includes(value)) return
    setCurrencies([...currencies, value])
    setNewCurrency('')
  }

  const save = async () => {
    setSaving(true)
    const newSettings = {
      ...initialSettings,
      defaultCurrency: currency,
      enabledCurrencies: currencies,
    }
    await supabase
      .from('profiles')
      .update({ settings: newSettings })
      .eq('id', userId)
    setSaving(false)
  }

  return (
    <div className="card space-y-3">
      <div>
        <label className="block mb-1">Default currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1">Enabled currencies</label>
        <ul className="mb-2 list-disc list-inside">
          {currencies.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value)}
            className="border px-2 py-1 rounded"
            placeholder="Add currency"
          />
          <button
            type="button"
            onClick={addCurrency}
            className="px-3 py-1 border rounded"
          >
            Add
          </button>
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-3 py-2 rounded-md border disabled:opacity-50 hover:bg-neutral-100"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
