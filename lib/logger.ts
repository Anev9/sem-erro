type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  context: string
  message: string
  timestamp: string
  details?: unknown
}

function log(level: LogLevel, context: string, message: string, details?: unknown) {
  const entry: LogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(details !== undefined && { details }),
  }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.log(output)
}

export const logger = {
  info: (context: string, message: string, details?: unknown) => log('info', context, message, details),
  warn: (context: string, message: string, details?: unknown) => log('warn', context, message, details),
  error: (context: string, message: string, details?: unknown) => log('error', context, message, details),
}
