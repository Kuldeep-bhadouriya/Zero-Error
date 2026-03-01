import { describe, expect, it } from 'vitest'
import { getSafeImageExtension, sanitizeFileName } from '../../lib/file-utils'

describe('file-utils', () => {
  it('sanitizes and trims unsafe file names', () => {
    expect(sanitizeFileName('  😀 my   profile###image!!.png  ')).toBe('my-profile-image-.png')
  })

  it('returns fallback file when sanitized value is empty', () => {
    expect(sanitizeFileName('...---...')).toBe('file')
  })

  it('uses extension from file name when allowed', () => {
    expect(getSafeImageExtension('avatar.webp', 'image/jpeg')).toBe('webp')
  })

  it('maps mime type to safe extension when name extension is invalid', () => {
    expect(getSafeImageExtension('avatar.exe', 'image/png')).toBe('png')
  })

  it('defaults to jpg when mime type is unknown', () => {
    expect(getSafeImageExtension('avatar.unknown', 'application/octet-stream')).toBe('jpg')
  })
})
