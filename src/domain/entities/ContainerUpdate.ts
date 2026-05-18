export interface ContainerUpdate {
    name: string
    image: string
    previousDigest: string
    newDigest: string
    timestamp: Date
}
