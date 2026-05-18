import type { Notifier } from '../../domain/ports/Notifier.js'
import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'

export class TelegramNotifier implements Notifier {
    private readonly baseUrl: string

    constructor(
        botToken: string,
        private readonly chatId: string,
    ) {
        this.baseUrl = `https://api.telegram.org/bot${botToken}`
    }

    async notify(update: ContainerUpdate): Promise<void> {
        const text = [
            `<b>Container updated: ${update.name}</b>`,
            `Image: <code>${update.image}</code>`,
            `Previous: <code>${update.previousDigest.slice(0, 19)}</code>`,
            `New:      <code>${update.newDigest.slice(0, 19)}</code>`,
            `Time: ${update.timestamp.toISOString()}`,
        ].join('\n')

        const response = await fetch(`${this.baseUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'HTML' }),
        })

        if (!response.ok) {
            throw new Error(`Telegram API failed: ${response.status} ${response.statusText}`)
        }
    }
}
