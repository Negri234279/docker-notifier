export interface ContainerStartEvent {
    id: string
    name: string
    image: string
    imageId: string
}

export interface ContainerWatcher {
    getRunningContainers(): Promise<Map<string, string>>
    watchEvents(onStart: (event: ContainerStartEvent) => Promise<void>): Promise<void>
}
