import type { ContainerUpdate } from '../../domain/entities/ContainerUpdate.js'
import type { ContainerSnapshot, ContainerStartEvent } from '../../domain/ports/ContainerWatcher.js'
import type { Notifier } from '../../domain/ports/Notifier.js'
import { logger } from '../../infrastructure/logger.js'

export class HandleContainerUpdate {
    private readonly digestMap = new Map<string, ContainerSnapshot>()

    constructor(private readonly notifiers: Notifier[]) {}

    initialize(initialDigests: Map<string, ContainerSnapshot>): void {
        for (const [name, snapshot] of initialDigests) {
            this.digestMap.set(name, snapshot)
        }

        logger.info(`Digest map initialized with ${this.digestMap.size} containers`)
    }

    async handle(event: ContainerStartEvent): Promise<void> {
        const previous = this.digestMap.get(event.name)

        if (!previous) {
            logger.info(`New container registered: ${event.name}`)

            this.digestMap.set(event.name, {
                imageId: event.imageId,
                version: event.version,
                revision: event.revision,
                createdAt: event.createdAt,
            })

            return
        }

        this.digestMap.set(event.name, {
            imageId: event.imageId,
            version: event.version,
            revision: event.revision,
            createdAt: event.createdAt,
        })

        if (previous.imageId === event.imageId) {
            logger.debug(`Container restarted (no image change): ${event.name}`)
            return
        }

        logger.info(
            `Container updated: ${event.name} (${previous.imageId.slice(0, 19)} -> ${event.imageId.slice(0, 19)})`,
        )

        const update: ContainerUpdate = {
            name: event.name,
            image: event.image,
            previousDigest: previous.imageId,
            newDigest: event.imageId,
            previousVersion: previous.version,
            newVersion: event.version,
            newRevision: event.revision,
            newCreatedAt: event.createdAt,
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
