import 'dotenv/config'

export const env = {
    logLevel: (process.env.LOG_LEVEL ?? 'info') as 'error' | 'warn' | 'info' | 'debug',
    discordWebhook: process.env.DISCORD_WEBHOOK,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    dockerHost: process.env.DOCKER_HOST,
} as const
