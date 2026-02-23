import pino from 'pino'

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const pinoLogger = pino({
  level,
  base: undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'emailPassword',
    ],
    remove: true,
  },
})

const logger = {
  debug: (...args: unknown[]) => (pinoLogger.debug as (...params: unknown[]) => void)(...args),
  info: (...args: unknown[]) => (pinoLogger.info as (...params: unknown[]) => void)(...args),
  warn: (...args: unknown[]) => (pinoLogger.warn as (...params: unknown[]) => void)(...args),
  error: (...args: unknown[]) => (pinoLogger.error as (...params: unknown[]) => void)(...args),
}

export default logger
