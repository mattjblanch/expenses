export function monthBounds(ym: string) {
  const [y,m] = ym.split('-').map(Number)
  const start = new Date(Date.UTC(y, m-1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  const iso = (d: Date) => d.toISOString().slice(0,10)
  return { start, end, startISO: iso(start), endISO: iso(end) }
}