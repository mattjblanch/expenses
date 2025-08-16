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
  const [checking, setChecking] = useState(false)
  const [checkInfo, setCheckInfo] = useState<{
    name: string
    rate: number
  } | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  const addCurrency = () => {
    if (!checkInfo) return
    const value = newCurrency.trim().toUpperCase()
    if (!value || currencies.includes(value)) return
    setCurrencies([...currencies, value])
    setNewCurrency('')
    setCheckInfo(null)
    setCheckError(null)
  }

  const checkCurrency = async () => {
    const code = newCurrency.trim().toUpperCase()
    if (!code) return
    setChecking(true)
    setCheckError(null)
    setCheckInfo(null)
    try {
      const [latestRes, currenciesRes] = await Promise.all([
        fetch(
          `https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=${code}`
        ),
        fetch('https://api.frankfurter.dev/v1/currencies'),
      ])
      if (!latestRes.ok || !currenciesRes.ok) throw new Error('Network error')
      const latestData = await latestRes.json()
      const currenciesData = await currenciesRes.json()
      const rate = latestData.rates?.[code]
      const name = currenciesData?.[code]
      if (typeof rate !== 'number' || !name) throw new Error('Invalid code')
      // API returns the amount of new currency for 1 base currency; invert for display
      const convertedRate = 1 / rate
      setCheckInfo({ name, rate: convertedRate })
    } catch (e) {
      setCheckError('Invalid currency code')
    } finally {
      setChecking(false)
    }
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
            onChange={(e) => {
              setNewCurrency(e.target.value)
              setCheckInfo(null)
              setCheckError(null)
            }}
            className="border px-2 py-1 rounded"
            placeholder="Add currency"
          />
          <button
            type="button"
            onClick={checkCurrency}
            disabled={checking || !newCurrency.trim()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
          <button
            type="button"
            onClick={addCurrency}
            disabled={!checkInfo}
            className={`px-3 py-1 border rounded ${checkInfo ? 'bg-green-600 text-white' : 'opacity-50 cursor-not-allowed'}`}
          >
            Add
          </button>
        </div>
        {checkInfo && (
          <div className="text-sm mt-1">
            {checkInfo.name}: 1 {newCurrency.trim().toUpperCase()} =
            {` ${checkInfo.rate} ${currency}`}
          </div>
        )}
        {checkError && (
          <div className="text-sm text-red-600 mt-1">{checkError}</div>
        )}
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
