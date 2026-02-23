type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const isValidLevel = (value: string | undefined): value is LogLevel => {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error'
}

const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
const configuredLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase()
const activeLevel: LogLevel = isValidLevel(configuredLevel) ? configuredLevel : defaultLevel

const shouldLog = (level: LogLevel) => levelOrder[level] >= levelOrder[activeLevel]

const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(...args)
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...args)
    }
  },
}

export default logger