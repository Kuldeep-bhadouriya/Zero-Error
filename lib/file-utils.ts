export function sanitizeFileName(inputName: string) {
  const normalized = inputName.normalize('NFKD')
  const stripped = normalized.replace(/[^a-zA-Z0-9._-]/g, '-')
  const collapsed = stripped.replace(/-+/g, '-').replace(/\.+/g, '.')
  const trimmed = collapsed.replace(/^[-.]+|[-.]+$/g, '')
  const limited = trimmed.slice(0, 80)
  return limited || 'file'
}

export function getSafeImageExtension(fileName: string, mimeType: string) {
  const extFromName = fileName.split('.').pop()?.toLowerCase()
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp'])

  if (extFromName && allowed.has(extFromName)) {
    return extFromName
  }

  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  return byMime[mimeType] || 'jpg'
}
