export function toCsv(rows: any[]): string {
  const headers = [
    'date','amount','currency','description','vendor','category','receipt_url','export_id'
  ]
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
  }
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push([
      r.date, r.amount, r.currency, r.description ?? '', r.vendor ?? '', r.category ?? '',
      r.receipt_url ?? '', r.export_id ?? ''
    ].map(esc).join(','))
  }
  return lines.join('\r\n')
}