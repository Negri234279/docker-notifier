export interface ContainerUpdate {
    name: string
    image: string
    previousDigest: string
    newDigest: string
    previousVersion?: string
    newVersion?: string
    newRevision?: string
    newCreatedAt?: string
    timestamp: Date
}
