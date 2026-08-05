import { z } from "zod"

export const contactCategories = [
  "労働社会保険手続き",
  "労務管理相談",
  "就業規則",
  "行政調査対応",
  "助成金",
  "その他",
] as const

// 正規表現
const noLineBreaks = /^[^\r\n]*$/u
const phoneNumber = /^[0-9０-９+＋()（）\-ー―−\s]+$/u

const optionalTrimmedText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .regex(noLineBreaks)
    .optional()
    .transform((value) => value || undefined)

export const contactRequestSchema = z.strictObject({
  company: optionalTrimmedText(100),
  name: z.string().trim().min(1).max(100).regex(noLineBreaks),
  email: z.string().trim().pipe(z.email().max(254)),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(phoneNumber)
    .optional()
    .transform((value) => value || undefined),
  category: z.enum(contactCategories),
  message: z.string().trim().min(10).max(2000),
  privacy: z.literal(true),
  turnstileToken: z.string().min(1).max(2048),
})

export type ContactRequest = z.infer<typeof contactRequestSchema>
