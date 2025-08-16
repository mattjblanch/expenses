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
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const newSettings = { ...initialSettings, defaultCurrency: currency }
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
          {initialSettings.enabledCurrencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
