export interface ContainerSnapshot {
    imageId: string
    version?: string
    revision?: string
    createdAt?: string
}

export interface ContainerStartEvent {
    id: string
    name: string
    image: string
    imageId: string
    version?: string
    revision?: string
    createdAt?: string
}

export interface ContainerWatcher {
    getRunningContainers(): Promise<Map<string, ContainerSnapshot>>
    watchEvents(onStart: (event: ContainerStartEvent) => Promise<void>): Promise<void>
}
