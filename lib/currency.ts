export interface CurrencyExpense {
  amount: number
  currency: string
}

// Convert array of expenses to target currency using Frankfurter API
export async function convertExpenses<T extends CurrencyExpense>(
  expenses: T[],
  target: string
): Promise<T[]> {
  const uniqueCurrencies = Array.from(
    new Set(expenses.map((e) => e.currency))
  ).filter((c) => c !== target)
  const rates: Record<string, number> = {}
  await Promise.all(
    uniqueCurrencies.map(async (c) => {
      try {
        const res = await fetch(
          `https://api.frankfurter.dev/v1/latest?from=${c}&to=${target}`
        )
        const data = await res.json()
        const rate = data.rates?.[target]
        if (typeof rate === 'number') rates[c] = rate
      } catch {
        // if fetch fails, default to 1 (no conversion)
        rates[c] = 1
      }
    })
  )
  return expenses.map((e) => ({
    ...e,
    amount: e.amount * (rates[e.currency] ?? 1),
    currency: target,
  }))
}
