const inviteMap = new Map<string, string>()

export function inviteUser(user: string, channelId: string) {
    inviteMap.set(user, channelId)
    setTimeout(() => {
        if (inviteMap.get(user) === channelId) inviteMap.delete(user)
    }, 60 * 1000)
}

export function isInvited(user: string) {
    if (!inviteMap.has(user)) return undefined
    return inviteMap.get(user)
}

export function removeInvite(user: string, channelId: string) {
    if (inviteMap.get(user) === channelId) inviteMap.delete(user)
}