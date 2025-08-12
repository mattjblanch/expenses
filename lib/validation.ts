import { z } from 'zod'

export const expenseSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3).transform((s) => s.toUpperCase()),
  occurred_on: z.string(), // 'YYYY-MM-DD'
  description: z.string().max(500).optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid().optional().nullable(),
  receipt_filename: z.string().optional().nullable(),
})

export const categorySchema = z.object({ name: z.string().min(1).max(100) })
export const accountSchema  = z.object({ name: z.string().min(1).max(100) })

export const exportRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  includeExported: z.boolean().optional().default(false),
  currency: z.string().length(3).optional(),
})