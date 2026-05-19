import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'
import type { Notifier } from '../../domain/ports/Notifier.js'
import { dockerHubUrl } from './dockerHub.js'

export class DiscordNotifier implements Notifier {
    constructor(private readonly webhookUrl: string) {}

    async notify(update: ContainerUpdate): Promise<void> {
        const fields = [
            {
                name: 'Image',
                value: update.image,
                inline: false,
            },
            {
                name: 'Previous digest',
                value: update.previousDigest.slice(0, 19),
                inline: true,
            },
            {
                name: 'New digest',
                value: update.newDigest.slice(0, 19),
                inline: true,
            },
        ]

        if (update.previousVersion ?? update.newVersion) {
            const versionLink = (v: string): string => {
                const url = dockerHubUrl(update.image, v)
                return url ? `[${v}](${url})` : v
            }

            const prev = update.previousVersion ? versionLink(update.previousVersion) : 'unknown'
            const next = update.newVersion ? versionLink(update.newVersion) : 'unknown'

            fields.push({ name: 'Version', value: `${prev} → ${next}`, inline: false })
        }

        if (update.newRevision) {
            fields.push({ name: 'Revision', value: update.newRevision.slice(0, 12), inline: true })
        }

        if (update.newCreatedAt) {
            fields.push({ name: 'Built', value: update.newCreatedAt, inline: true })
        }

        fields.push({ name: 'Timestamp', value: update.timestamp.toISOString(), inline: false })

        const body = {
            embeds: [
                {
                    title: `Container updated: ${update.name}`,
                    color: 0x00bcd4,
                    fields,
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
