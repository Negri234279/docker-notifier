import { env } from './config/env.js'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

const levels: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 }
const threshold = levels[env.logLevel] ?? levels.info

const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
    if (levels[level] > threshold) return

    const ts = new Date().toISOString()
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    fn(`[${ts}] [${level.toUpperCase()}] ${message}`, ...args)
}

export const logger = {
    error: (msg: string, ...args: unknown[]) => log('error', msg, ...args),
    warn: (msg: string, ...args: unknown[]) => log('warn', msg, ...args),
    info: (msg: string, ...args: unknown[]) => log('info', msg, ...args),
    debug: (msg: string, ...args: unknown[]) => log('debug', msg, ...args),
}
