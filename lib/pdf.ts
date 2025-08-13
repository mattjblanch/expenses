import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function buildExpenseFormPdf(opts: {
  appName: string
  userEmail: string
  periodLabel: string
  totals: { total: number; currency: string; count: number }
}) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const sanitize = (text: string) => text.replace(/→/g, '->').replace(/[\x80-\uFFFF]/g, '')

  const draw = (text: string, x: number, y: number, size=12) => {
    page.drawText(sanitize(text), { x, y, size, font, color: rgb(0,0,0) })
  }

  draw(opts.appName + ' - Expense Report', 50, 740, 18)
  draw('User: ' + opts.userEmail, 50, 710, 12)
  draw('Period: ' + opts.periodLabel, 50, 690, 12)
  draw(`Total: ${opts.totals.total.toFixed(2)} ${opts.totals.currency} (${opts.totals.count} items)`, 50, 670, 12)

  return await doc.save()
}
