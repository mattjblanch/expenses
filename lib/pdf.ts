import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function buildExpenseFormPdf(opts: {
  appName: string
  userEmail: string
  periodLabel: string
  totals: { total: number; currency: string; count: number }
  expenses: { date: string; amount: number; currency: string; description?: string | null; vendor?: string | null; category?: string | null }[]
}) {
  const doc = await PDFDocument.create()
  let page = doc.addPage([612, 792]) // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const sanitize = (text: string) => text.replace(/→/g, '->').replace(/[\x80-\uFFFF]/g, '')

  const draw = (text: string, x: number, y: number, size=12) => {
    page.drawText(sanitize(text), { x, y, size, font, color: rgb(0,0,0) })
  }

  draw(opts.appName + ' - Expense Report', 50, 740, 18)
  draw('User: ' + opts.userEmail, 50, 710, 12)
  draw('Period: ' + opts.periodLabel, 50, 690, 12)
  draw(`Total: ${opts.totals.total.toFixed(2)} ${opts.totals.currency} (${opts.totals.count} items)`, 50, 670, 12)

  let y = 640
  draw('Date', 50, y, 12)
  draw('Description', 150, y, 12)
  draw('Amount', 450, y, 12)
  y -= 20
  for (const e of opts.expenses) {
    if (y < 40) {
      page = doc.addPage([612, 792])
      y = 740
      draw('Date', 50, y, 12)
      draw('Description', 150, y, 12)
      draw('Amount', 450, y, 12)
      y -= 20
    }
    const desc = `${e.vendor || ''} ${e.description || ''}`.trim()
    draw((e.date || '').slice(0,10), 50, y, 10)
    draw(desc.slice(0,60), 150, y, 10)
    draw(`${Number(e.amount).toFixed(2)} ${e.currency}`, 450, y, 10)
    y -= 20
  }

  return await doc.save()
}
