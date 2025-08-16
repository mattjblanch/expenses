'use client'

import { useEffect, useState } from 'react'
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
  const [adding, setAdding] = useState(false)
  const [checkInfo, setCheckInfo] = useState<{
    name: string
    rate: number
  } | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [showCurrencies, setShowCurrencies] = useState(false)
  const [currencyInfo, setCurrencyInfo] = useState<
    Record<string, { name: string; rate: number }>
  >({})

  const addCurrency = async () => {
    if (!checkInfo) return
    const value = newCurrency.trim().toUpperCase()
    if (!value || currencies.includes(value)) return
    setAdding(true)
    try {
      await supabase
        .from('user_currencies')
        .insert({ user_id: userId, currency: value })
      setCurrencies([...currencies, value])
      setNewCurrency('')
      setCheckInfo(null)
      setCheckError(null)
    } finally {
      setAdding(false)
    }
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
      setCheckInfo({ name, rate })
    } catch (e) {
      setCheckError('Invalid currency code')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!showCurrencies) return
    const fetchInfo = async () => {
      try {
        const symbols = currencies.filter((c) => c !== currency).join(',')
        const url = symbols
          ? `https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=${symbols}`
          : `https://api.frankfurter.dev/v1/latest?base=${currency}`
        const [latestRes, currenciesRes] = await Promise.all([
          fetch(url),
          fetch('https://api.frankfurter.dev/v1/currencies'),
        ])
        if (!latestRes.ok || !currenciesRes.ok) throw new Error('Network error')
        const latestData = await latestRes.json()
        const currenciesData = await currenciesRes.json()
        const info: Record<string, { name: string; rate: number }> = {}
        currencies.forEach((c) => {
          const name = currenciesData?.[c]
          if (!name) return
          if (c === currency) {
            info[c] = { name, rate: 1 }
          } else {
            const rate = latestData.rates?.[c]
            if (typeof rate === 'number') info[c] = { name, rate }
          }
        })
        setCurrencyInfo(info)
      } catch {
        setCurrencyInfo({})
      }
    }
    fetchInfo()
  }, [showCurrencies, currency, currencies])

  const save = async () => {
    setSaving(true)
    const newSettings = {
      defaultCurrency: currency,
    }
    await supabase
      .from('profiles')
      .update({ settings: newSettings })
      .eq('id', userId)
    await supabase
      .from('user_currencies')
      .delete()
      .eq('user_id', userId)
    if (currencies.length) {
      await supabase
        .from('user_currencies')
        .insert(currencies.map((c) => ({ user_id: userId, currency: c })))
    }
    setSaving(false)
  }

  const sortedCurrencies = [...currencies].sort((a, b) => {
    if (a === currency) return -1
    if (b === currency) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="card space-y-3">
      <div>
        <label className="block mb-1">Default currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {sortedCurrencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1">Enabled currencies</label>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={showCurrencies}
            onChange={() => setShowCurrencies(!showCurrencies)}
          />
          Show enabled currencies
        </label>
        {showCurrencies && (
          <>
            <ul className="mb-2 list-disc list-inside">
              {sortedCurrencies.map((c) => (
                <li key={c} className="flex justify-between">
                  <span>{c}:</span>
                  {currencyInfo[c] && (
                    <>
                      <span className="flex-1 text-center">{currencyInfo[c].name}:</span>
                      <span className="text-right">{`1 ${currency} = ${currencyInfo[c].rate.toFixed(4)} ${c}`}</span>
                    </>
                  )}
                </li>
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
                onClick={checkInfo ? addCurrency : checkCurrency}
                disabled={checking || adding || !newCurrency.trim()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {checkInfo
                  ? adding
                    ? 'Adding...'
                    : 'Add Currency'
                  : checking
                    ? 'Validating...'
                    : 'Validate'}
              </button>
            </div>
            {checkInfo && (
              <div className="text-sm mt-1">
                {checkInfo.name}: 1 {currency} = {` ${checkInfo.rate.toFixed(4)} ${newCurrency.trim().toUpperCase()}`}
              </div>
            )}
            {checkError && (
              <div className="text-sm text-red-600 mt-1">{checkError}</div>
            )}
          </>
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
