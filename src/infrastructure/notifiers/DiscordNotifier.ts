import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'
import type { Notifier } from '../../domain/ports/Notifier.js'

export class DiscordNotifier implements Notifier {
    constructor(private readonly webhookUrl: string) {}

    async notify(update: ContainerUpdate): Promise<void> {
        const body = {
            embeds: [
                {
                    title: `Container updated: ${update.name}`,
                    color: 0x00bcd4,
                    fields: [
                        { name: 'Image', value: update.image, inline: false },
                        {
                            name: 'Previous digest',
                            value: update.previousDigest.slice(0, 19),
                            inline: true,
                        },
                        { name: 'New digest', value: update.newDigest.slice(0, 19), inline: true },
                        { name: 'Timestamp', value: update.timestamp.toISOString(), inline: false },
                    ],
                },
            ],
        }

        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`)
        }
    }
}
