import { z } from 'zod'

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId')

export function requiredTextSchema(fieldName: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or fewer`)
}

export function optionalTextSchema(fieldName: string, maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or fewer`)
    .optional()
}

export function badRequestFromZod(error: z.ZodError) {
  const firstIssue = error.issues[0]
  return {
    error: firstIssue?.message || 'Invalid request payload',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}
