import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'
import type { ContainerStartEvent } from '../../domain/ports/ContainerWatcher.js'
import type { Notifier } from '../../domain/ports/Notifier.js'
import { logger } from '../../infrastructure/logger.js'

export class HandleContainerUpdate {
    private readonly digestMap = new Map<string, string>()

    constructor(private readonly notifiers: Notifier[]) {}

    initialize(initialDigests: Map<string, string>): void {
        for (const [name, digest] of initialDigests) {
            this.digestMap.set(name, digest)
        }

        logger.info(`Digest map initialized with ${this.digestMap.size} containers`)
    }

    async handle(event: ContainerStartEvent): Promise<void> {
        const previousDigest = this.digestMap.get(event.name)

        if (!previousDigest) {
            logger.info(`New container registered: ${event.name}`)
            this.digestMap.set(event.name, event.imageId)
            return
        }

        this.digestMap.set(event.name, event.imageId)

        if (previousDigest === event.imageId) {
            logger.debug(`Container restarted (no image change): ${event.name}`)
            return
        }

        logger.info(
            `Container updated: ${event.name} (${previousDigest.slice(0, 19)} -> ${event.imageId.slice(0, 19)})`,
        )

        const update: ContainerUpdate = {
            name: event.name,
            image: event.image,
            previousDigest,
            newDigest: event.imageId,
            timestamp: new Date(),
        }

        for (const notifier of this.notifiers) {
            try {
                await notifier.notify(update)
            } catch (error) {
                logger.warn(
                    `Notifier failed for ${event.name}: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
        }
    }
}
