import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'
import type { Notifier } from '../../domain/ports/Notifier.js'
import { dockerHubUrl } from './dockerHub.js'

export class TelegramNotifier implements Notifier {
    private readonly baseUrl: string

    constructor(
        botToken: string,
        private readonly chatId: string,
    ) {
        this.baseUrl = `https://api.telegram.org/bot${botToken}`
    }

    async notify(update: ContainerUpdate): Promise<void> {
        const lines = [
            `<b>Container updated: ${update.name}</b>`,
            `Image: <code>${update.image}</code>`,
            `Previous: <code>${update.previousDigest.slice(0, 19)}</code>`,
            `New:      <code>${update.newDigest.slice(0, 19)}</code>`,
        ]

        if (update.previousVersion ?? update.newVersion) {
            const versionLink = (v: string): string => {
                const url = dockerHubUrl(update.image, v)
                return url ? `<a href="${url}">${v}</a>` : v
            }

            const prev = update.previousVersion ? versionLink(update.previousVersion) : 'unknown'
            const next = update.newVersion ? versionLink(update.newVersion) : 'unknown'

            lines.push(`Version: ${prev} → ${next}`)
        }

        if (update.newRevision) {
            lines.push(`Revision: <code>${update.newRevision.slice(0, 12)}</code>`)
        }

        if (update.newCreatedAt) {
            lines.push(`Built: <code>${update.newCreatedAt}</code>`)
        }

        lines.push(`Time: ${update.timestamp.toISOString()}`)

        const response = await fetch(`${this.baseUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.chatId,
                text: lines.join('\n'),
                parse_mode: 'HTML',
            }),
        })

        if (!response.ok) {
            throw new Error(`Telegram API failed: ${response.status} ${response.statusText}`)
        }
    }
}
