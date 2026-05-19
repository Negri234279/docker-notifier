export const dockerHubUrl = (image: string, version: string): string | null => {
    const repo = image.split(':')[0]
    if (!repo.includes('/')) return null

    return `https://hub.docker.com/repository/docker/${repo}/tags/${version}`
}
