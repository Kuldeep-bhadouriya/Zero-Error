import pino from 'pino'

export function createLogger(level: string) {
  return pino({
    level,
    base: undefined,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'internalServiceToken',
        'internalSigningSecret',
        'token',
        'secret',
      ],
      remove: true,
    },
  })
}
