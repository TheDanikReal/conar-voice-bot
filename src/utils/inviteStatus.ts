const inviteMap = new Map<string, string>();

export function addInvite(user: string, channelId: string) {
    inviteMap.set(user, channelId);
    setTimeout(() => {
        if (inviteMap.get(user) === channelId) inviteMap.delete(user);
    }, 60 * 1000);
}
