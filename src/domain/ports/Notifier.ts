import type { ContainerUpdate } from '../entities/ContainerUpdate.js'

export interface Notifier {
    notify(update: ContainerUpdate): Promise<void>
}
