import Docker from 'dockerode'

import type { ContainerStartEvent, ContainerWatcher } from '../../domain/ports/ContainerWatcher.js'
import { logger } from '../logger.js'

interface RawDockerEvent {
    Type: string
    Action: string
    Actor: {
        ID: string
        Attributes: Record<string, string>
    }
    scope: string
    time: number
    timeNano: number
}

export class DockerodeWatcher implements ContainerWatcher {
    constructor(private readonly docker: Docker) {}

    async getRunningContainers(): Promise<Map<string, string>> {
        const containers = await this.docker.listContainers()
        const map = new Map<string, string>()

        for (const c of containers) {
            const name = (c.Names[0] ?? c.Id).replace(/^\//, '')
            map.set(name, c.ImageID)
        }

        return map
    }

    async watchEvents(onStart: (event: ContainerStartEvent) => Promise<void>): Promise<void> {
        const stream = await this.docker.getEvents({
            filters: { type: ['container'], event: ['start'] },
        })

        return new Promise((resolve, reject) => {
            let buffer = ''

            stream.on('data', (chunk: Buffer) => {
                buffer += chunk.toString()
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.trim()) continue

                    let raw: RawDockerEvent

                    try {
                        raw = JSON.parse(line) as RawDockerEvent
                    } catch {
                        continue
                    }

                    this.buildEvent(raw)
                        .then((event) => {
                            if (event) return onStart(event)
                            logger.debug(
                                `buildEvent returned null for actor=${raw.Actor?.Attributes?.name ?? 'unknown'}`,
                            )
                        })
                        .catch((err) => logger.warn(`Event processing error: ${String(err)}`))
                }
            })

            stream.on('end', () => resolve())
            stream.on('error', reject)
        })
    }

    private async buildEvent(raw: RawDockerEvent): Promise<ContainerStartEvent | null> {
        try {
            const name = raw.Actor.Attributes['name']
            const image = raw.Actor.Attributes['image']

            const imageInfo = await this.docker.getImage(image).inspect()
            const imageId = imageInfo.Id

            logger.debug(`buildEvent ok: name=${name} imageId=${imageId.slice(0, 19)}`)

            return { id: raw.Actor.ID, name, image, imageId }
        } catch {
            return null
        }
    }
}
