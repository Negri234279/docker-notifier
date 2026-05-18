import Docker from 'dockerode'

import { HandleContainerUpdate } from './application/use-cases/HandleContainerUpdate.js'
import type { Notifier } from './domain/ports/Notifier.js'
import { env } from './infrastructure/config/env.js'
import { DockerodeWatcher } from './infrastructure/docker/DockerodeWatcher.js'
import { logger } from './infrastructure/logger.js'
import { DiscordNotifier } from './infrastructure/notifiers/DiscordNotifier.js'
import { TelegramNotifier } from './infrastructure/notifiers/TelegramNotifier.js'

async function main(): Promise<void> {
    const notifiers: Notifier[] = []

    if (env.discordWebhook) {
        notifiers.push(new DiscordNotifier(env.discordWebhook))
        logger.info('Discord notifier enabled')
    }

    if (env.telegramBotToken && env.telegramChatId) {
        notifiers.push(new TelegramNotifier(env.telegramBotToken, env.telegramChatId))
        logger.info('Telegram notifier enabled')
    }

    if (!notifiers.length) {
        logger.warn(
            'No notifiers configured — set DISCORD_WEBHOOK or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID',
        )
    }

    const docker = new Docker()

    try {
        await docker.ping()
        logger.info('Connected to Docker socket')
    } catch {
        logger.error('Docker socket not available')
        process.exit(1)
    }

    const watcher = new DockerodeWatcher(docker)
    const handler = new HandleContainerUpdate(notifiers)

    const initialDigests = await watcher.getRunningContainers()
    handler.initialize(initialDigests)

    logger.info('Watching Docker events...')

    while (true) {
        try {
            await watcher.watchEvents((event) => handler.handle(event))
            logger.warn('Docker event stream ended, reconnecting...')
        } catch (error) {
            logger.warn(
                `Docker event stream error: ${error instanceof Error ? error.message : String(error)}, reconnecting...`,
            )
        }

        await sleep(1000)
    }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})

process.on('unhandledRejection', (reason) => {
    logger.error(
        `Unhandled promise rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
    )
})

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
})
